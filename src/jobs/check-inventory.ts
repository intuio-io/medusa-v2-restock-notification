// src/jobs/check-inventory.ts
import { IProductModuleService, IInventoryService, MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { RestockService } from "../services/restock"
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
                        const batch = emails.slice(i, i + BATCH_SIZE)
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