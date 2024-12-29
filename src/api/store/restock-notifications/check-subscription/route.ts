// src/api/store/restock-notifications/check-subscription/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { RestockService } from "../../../../services/restock"

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

/*
http://localhost:9000/store/restock-notifications/check-subscription?email=kris@intuio.io&variant_id=variant_01JFVPNW5RWNWCZH84CT3ERDHV
response
{
    "variant_id": "variant_01JFVPNW5RWNWCZH84CT3ERDHV",
    "email": "kris@intuio.io",
    "is_subscribed": true,
    "subscription": {
        "id": "res_01JG99JWX6YQEWST8VYBVRACVT",
        "email": "kris@intuio.io",
        "variant_id": "variant_01JFVPNW5RWNWCZH84CT3ERDHV",
        "product_title": "Medusa T-Shirt",
        "variant_title": "M / Black",
        "notified": false,
        "created_at": "2024-12-29T13:27:14.085Z",
        "updated_at": "2024-12-29T13:27:14.085Z"
    }
}
*/