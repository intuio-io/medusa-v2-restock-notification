# Medusa Restock Notification Module (v2)

A Medusa module that enables restock notifications for your e-commerce store. This module allows customers to subscribe to out-of-stock products and receive email notifications when items are back in stock.

## Features

- Allow customers to subscribe to out-of-stock products
- Send automated restock notifications via SendGrid
- Track subscription status
- Admin API for managing subscriptions
- Store API for customer subscriptions
- Scheduled job for checking inventory levels
- Support for batch email notifications

## Installation

```bash
npm install @intuio/medusa-restock-notification
```

## Module Configuration

Add to your `medusa-config.js`:

```javascript
module.exports = {
  projectConfig: {
    // ... other config
    database_type: "postgres",
    redis_url: REDIS_URL,
    database_url: DATABASE_URL,
  },
  modules: [
    {
      resolve: "@intuio/medusa-restock-notification"
    }
  ]
}
```

## Environment Variables

Add to your `.env`:

```bash
SENDGRID_API_KEY=your_api_key
SENDGRID_FROM=notifications@yourstore.com
SENDGRID_RESTOCK_TEMPLATE_ID=your_template_id
STORE_NAME="Your Store Name"
```

## Implementation Guide

Since Medusa v2 requires API routes and jobs to be implemented at the application level, you'll need to create the following files in your Medusa project:

### 1. Store API Routes

#### Subscribe to Restock Notifications
Create `src/api/store/restock-notifications/route.ts`:

```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { RestockService } from "@intuio/medusa-restock-notification"
import { Modules } from "@medusajs/framework/utils"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
    const restockService = req.scope.resolve<RestockService>("restock")
    const productService = req.scope.resolve(Modules.PRODUCT)
    const inventoryService = req.scope.resolve(Modules.INVENTORY)
    const logger = req.scope.resolve("logger")

    try {
        const { variant_id, email }: any = req.body

        if (!variant_id || !email) {
            res.status(400).json({ message: "variant_id and email are required" })
            return
        }

        // Get variant details including SKU
        const variantDetails = await productService.listProductVariants({
            id: [variant_id],
        }, {
            relations: ["options", "product"],
        })

        if (!variantDetails?.length) {
            res.status(404).json({ message: "Variant not found" })
            return
        }

        const variant: any = variantDetails[0]
        const variantSku = variant.sku

        if (!variantSku) {
            logger.warn(`Variant ${variant_id} has no SKU`)
            res.status(400).json({ message: "Variant has no SKU" })
            return
        }

        // Get product details
        const product = await productService.retrieveProduct(variant.product_id)

        if (!product) {
            res.status(404).json({ message: "Product not found" })
            return
        }

        // Get inventory items by SKU
        const inventoryItems = await inventoryService.listInventoryItems({})
        const inventoryItem = inventoryItems.find(item => item.sku === variantSku)

        if (!inventoryItem) {
            logger.warn(`No inventory item found for SKU ${variantSku}`)
            res.status(404).json({ message: "No inventory item found" })
            return
        }

        // Get inventory levels for this item
        const levels = await inventoryService.listInventoryLevels({
            inventory_item_id: inventoryItem.id
        })

        // Calculate total stock quantity
        let stockQuantity = 0
        for (const level of levels) {
            stockQuantity += level.stocked_quantity || 0
        }

        if (stockQuantity > 0) {
            res.status(400).json({
                message: "Product is currently in stock",
                stock_quantity: stockQuantity
            })
            return
        }

        // Create subscription if out of stock
        const subscription = await restockService.subscribe(
            variant_id,
            email,
            product.title,
            variant.title
        )

        res.json({
            subscription,
            product_id: variant.product_id,
            variant_title: variant.title
        })
    } catch (error) {
        logger.error("Error in restock notification:", error)
        res.status(400).json({ message: error.message })
    }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
    const restockService = req.scope.resolve<RestockService>("restock")
    const { email } = req.query

    try {
        if (!email) {
            res.status(400).json({ message: "Email is required" })
            return
        }

        const subscriptions = await restockService.listSubscriptions(email as string)
        res.json({ subscriptions })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}
```

#### Check Subscription Status
Create `src/api/store/restock-notifications/check-subscription/route.ts`:

```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { RestockService } from "@intuio/medusa-restock-notification"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
    const restockService = req.scope.resolve<RestockService>("restock")
    const { email, variant_id } = req.query

    try {
        if (!email || !variant_id) {
            res.status(400).json({
                message: "email and variant_id are required"
            })
            return
        }

        const result = await restockService.isSubscribed(
            email as string,
            variant_id as string
        )

        res.json({
            variant_id,
            email,
            ...result
        })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}
```

#### Remove Subscription
Create `src/api/store/restock-notifications/[id]/route.ts`:

```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { RestockService } from "@intuio/medusa-restock-notification"

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
    const restockService = req.scope.resolve<RestockService>("restock")
    const { id } = req.params
    const { email }: any = req.body

    try {
        await restockService.removeSubscription(id, email)
        res.json({ success: true })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}
```

### 2. Admin API Routes

Create `src/api/admin/restock-notifications/route.ts`:

```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { RestockService } from "@intuio/medusa-restock-notification"
import { IProductModuleService, IInventoryService } from "@medusajs/types"
import { Modules } from "@medusajs/framework/utils"
import sgMail from "@sendgrid/mail"

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')

export async function GET(req: MedusaRequest, res: MedusaResponse) {
    const restockService = req.scope.resolve<RestockService>("restock")
    const { variant_id } = req.query

    try {
        if (!variant_id) {
            res.status(400).json({ message: "variant_id is required" })
            return
        }

        const subscribers = await restockService.getSubscribers(variant_id as string)
        res.json({ subscribers })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
    const restockService = req.scope.resolve<RestockService>("restock")
    const productService = req.scope.resolve<IProductModuleService>(Modules.PRODUCT)
    const inventoryService = req.scope.resolve<IInventoryService>(Modules.INVENTORY)
    const logger = req.scope.resolve("logger")

    try {
        const { variant_id }: any = req.body

        if (!variant_id) {
            res.status(400).json({
                message: "variant_id is required required"
            })
            return
        }

        const variantDetails = await productService.listProductVariants({
            id: [variant_id],
        }, {
            relations: ["options", "product"],
        })

        if (!variantDetails?.length) {
            res.status(404).json({ message: "Variant not found" })
            return
        }

        const variant: any = variantDetails[0]
        const variantSku = variant.sku

        if (!variantSku) {
            logger.warn(`Variant ${variant_id} has no SKU`)
            res.status(400).json({ message: "Variant has no SKU" })
            return
        }

        // Get product details
        const product = await productService.retrieveProduct(variant.product_id)

        if (!product) {
            res.status(404).json({ message: "Product not found" })
            return
        }

        // Get inventory items
        const inventoryItems = await inventoryService.listInventoryItems({})
        const inventoryItem = inventoryItems.find(item => item.sku === variantSku)

        if (!inventoryItem) {
            logger.warn(`No inventory item found for SKU ${variantSku}`)
            res.status(404).json({ message: "No inventory item found" })
            return
        }

        // Get inventory levels for this item
        const levels = await inventoryService.listInventoryLevels({
            inventory_item_id: inventoryItem.id
        })

        // Calculate total stock quantity
        let stockQuantity = 0
        for (const level of levels) {
            stockQuantity += level.stocked_quantity || 0
        }

        if (stockQuantity > 0) {
            res.status(400).json({
                message: "Product is currently in stock",
                stock_quantity: stockQuantity
            })
            return
        }

        // Get subscribers
        const subscribers = await restockService.getSubscribers(variant_id)

        if (subscribers.length === 0) {
            res.json({ message: "No subscribers found" })
            return
        }

        // Prepare email data
        const emails = subscribers.map(subscriber => ({
            to: subscriber.email,
            from: {
                email: process.env.SENDGRID_FROM || '',
                name: process.env.STORE_NAME || 'Your Store'
            },
            templateId: process.env.SENDGRID_RESTOCK_TEMPLATE_ID,
            dynamicTemplateData: {
                product_title: product.title,
                variant_title: variant.title,
                current_stock: stockQuantity
            }
        }))

        // Send emails in batches
        const BATCH_SIZE = 1000
        for (let i = 0; i < emails.length; i += BATCH_SIZE) {
            const batch: any = emails.slice(i, i + BATCH_SIZE)
            try {
                await sgMail.send(batch)
                logger.info(`Sent restock notifications batch ${i / BATCH_SIZE + 1}`)
            } catch (error) {
                logger.error(`Failed to send email batch: ${error.message}`)
                throw error
            }
        }

        // Mark notifications as sent
        await restockService.markNotified(subscribers.map(sub => sub.id))

        res.json({
            message: "Notifications sent successfully",
            count: subscribers.length,
            stock_quantity: stockQuantity
        })
    } catch (error) {
        logger.error(`Error in restock notification: ${error.message}`)
        res.status(400).json({
            message: "Failed to send notifications",
            error: error.message
        })
    }
}
```

### 3. Inventory Check Job

Create `src/jobs/check-inventory.ts`:

```typescript
import { IProductModuleService, IInventoryService, MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { RestockService } from "@intuio/medusa-restock-notification"
import sgMail from "@sendgrid/mail"

export default async function checkInventoryJob(container: MedusaContainer) {
    const logger = container.resolve("logger")
    const restockService = container.resolve("restock") as RestockService
    const productService = container.resolve<IProductModuleService>(Modules.PRODUCT)
    const inventoryService = container.resolve<IInventoryService>(Modules.INVENTORY)

    try {
        logger.info("Starting inventory check job")

        // Get all variants that have subscribers
        const allSubscriptions = await restockService.getAllActiveSubscriptions()

        // Group subscriptions by variant ID
        const variantSubscriptions = allSubscriptions.reduce((acc, sub) => {
            if (!acc[sub.variant_id]) {
                acc[sub.variant_id] = []
            }
            acc[sub.variant_id].push(sub)
            return acc
        }, {})

        // Process each variant
        for (const subscription of Object.entries(variantSubscriptions)) {
            const [variantId, subscribers]: any = subscription;
            try {
                // Get variant details from product service
                const variantDetails = await productService.listProductVariants({
                    id: [variantId],
                }, {
                    relations: ["product"]
                })

                if (!variantDetails?.length) {
                    logger.warn(`Variant ${variantId} not found`)
                    continue
                }

                const variant: any = variantDetails[0]
                const variantSku = variant.sku

                if (!variantSku) {
                    logger.warn(`Variant ${variantId} has no SKU`)
                    continue
                }

                // Get inventory items by SKU
                const inventoryItems = await inventoryService.listInventoryItems({})
                const inventoryItem = inventoryItems.find(item => item.sku === variantSku)

                if (!inventoryItem) {
                    logger.warn(`No inventory item found for SKU ${variantSku}`)
                    continue
                }

                // Get inventory levels for this item
                const levels = await inventoryService.listInventoryLevels({
                    inventory_item_id: inventoryItem.id
                })

                // Calculate total stock quantity
                let stockQuantity = 0
                for (const level of levels) {
                    stockQuantity += level.stocked_quantity || 0
                }

                // If item is in stock, notify subscribers
                if (stockQuantity > 0) {
                    logger.info(`Processing notifications for variant ${variantId} with stock ${stockQuantity}`)

                    // Prepare email data
                    const emails = subscribers.map(subscriber => ({
                        to: subscriber.email,
                        from: {
                            email: process.env.SENDGRID_FROM || '',
                            name: process.env.STORE_NAME || 'Your Store'
                        },
                        templateId: process.env.SENDGRID_RESTOCK_TEMPLATE_ID,
                        dynamicTemplateData: {
                            product_title: variant.product.title,
                            variant_title: variant.title,
                            current_stock: stockQuantity
                        }
                    }))

                    // Send emails in batches
                    const BATCH_SIZE = 1000
                    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
                        const batch: any = emails.slice(i, i + BATCH_SIZE)
                        try {
                            await sgMail.send(batch)
                            logger.info(`Sent restock notifications batch ${i / BATCH_SIZE + 1}`)
                        } catch (error) {
                            logger.error(`Failed to send email batch: ${error.message}`)
                            continue
                        }
                    }

                    // Mark subscribers as notified
                    await restockService.markNotified(subscribers.map(sub => sub.id))
                    logger.info(`Marked ${subscribers.length} subscribers as notified for variant ${variantId}`)
                }
            } catch (error) {
                logger.error(`Error processing variant ${variantId}: ${error.message}`)
                continue // Continue with next variant even if one fails
            }
        }

        logger.info("Completed inventory check job")
    } catch (error) {
        logger.error("Failed to process inventory check job:", error)
        throw error
    }
}

export const config = {
    name: "check-inventory-restock",
    schedule: "*/5 * * * *", // Run every 5 minutes
}
```

## API Reference

### Store Endpoints

#### Subscribe to Restock Notifications
- **POST** `/store/restock-notifications`
  ```json
  {
    "email": "customer@example.com",
    "variant_id": "variant_123"
  }
  ```

#### Get User's Subscriptions
- **GET** `/store/restock-notifications?email=customer@example.com`

#### Check Subscription Status
- **GET** `/store/restock-notifications/check-subscription?email=xxx&variant_id=xxx`

#### Remove Subscription
- **DELETE** `/store/restock-notifications/:id`
  ```json
  {
    "email": "customer@example.com"
  }
  ```

### Admin Endpoints

#### Get Subscribers for Variant
- **GET** `/admin/restock-notifications?variant_id=xxx`

#### Force Send Notifications
- **POST** `/admin/restock-notifications`
  ```json
  {
    "variant_id": "variant_123"
  }
  ```

## Customization

### SendGrid Template Variables

The following variables are available in your SendGrid email templates:
- `product_title` - The name of the product
- `variant_title` - The specific variant title
- `current_stock` - Current available stock quantity
- `store_name` - Your store name as configured in environment variables

### Job Schedule

The inventory check job runs every 5 minutes by default. You can modify the schedule in the job configuration using standard cron syntax. To change the schedule, modify the `config` object in the `check-inventory.ts` file:

```typescript
export const config = {
    name: "check-inventory-restock",
    schedule: "*/5 * * * *", // Modify this cron expression as needed
}
```

Common cron schedule examples:
- Every hour: `0 * * * *`
- Every day at midnight: `0 0 * * *`
- Every 15 minutes: `*/15 * * * *`

## Development

To work on the module locally:

```bash
# Install dependencies
npm install

# Build the module
npm run build

# Run migrations
npx medusa db:migrate

# Run in watch mode during development
npm run dev
```


## 💬 Let's Connect
We’re building this in public at Intuio Software Labs — a premium product studio focused on ecommerce and open-source innovation.
☕ Like the plugin? Buy us a coffee or support our efforts : [Donate here](https://buymeacoffee.com/intuio)

### 👥 Collaborate With Us
We’re looking for contributors, collaborators, and ecommerce founders to partner with. If you’re doing something cool with Medusa or want to build the next big thing, reach out!

📩 info@intuio.io / sales@intuio.io

🌐 https://intuio.io

## 🤝 Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

Check out the contributing guide to get started.

## 📜 License
MIT © Intuio Software Labs

## 📈 Loved By the Community?
If you’ve used this plugin and found it helpful, leave us a ⭐ on GitHub and share it with others using Medusa.
