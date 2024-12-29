// src/api/store/restock-notifications/[id]/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { RestockService } from "../../../../services/restock"

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

/*
Delete Request
http://localhost:9000/store/restock-notifications/res_01JG99JWX6YQEWST8VYBVRACVT

body
{
    "email": "kris@intuio.io"
}

response
{
    "success": true
}
*/