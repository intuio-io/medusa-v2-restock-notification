"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
async function GET(req, res) {
    const restockService = req.scope.resolve("restock");
    const { email, variant_id } = req.query;
    try {
        if (!email || !variant_id) {
            res.status(400).json({
                message: "email and variant_id are required"
            });
            return;
        }
        const result = await restockService.isSubscribed(email, variant_id);
        res.json({
            variant_id,
            email,
            ...result
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3Jlc3RvY2stbm90aWZpY2F0aW9ucy9jaGVjay1zdWJzY3JpcHRpb24vcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFJQSxrQkF5QkM7QUF6Qk0sS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQzdELE1BQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFpQixTQUFTLENBQUMsQ0FBQTtJQUNuRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUE7SUFFdkMsSUFBSSxDQUFDO1FBQ0QsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ3hCLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUNqQixPQUFPLEVBQUUsbUNBQW1DO2FBQy9DLENBQUMsQ0FBQTtZQUNGLE9BQU07UUFDVixDQUFDO1FBRUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxjQUFjLENBQUMsWUFBWSxDQUM1QyxLQUFlLEVBQ2YsVUFBb0IsQ0FDdkIsQ0FBQTtRQUVELEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDTCxVQUFVO1lBQ1YsS0FBSztZQUNMLEdBQUcsTUFBTTtTQUNaLENBQUMsQ0FBQTtJQUNOLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2IsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUE7SUFDcEQsQ0FBQztBQUNMLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBa0JFIn0=