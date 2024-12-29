"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DELETE = DELETE;
async function DELETE(req, res) {
    const restockService = req.scope.resolve("restock");
    const { id } = req.params;
    const { email } = req.body;
    try {
        await restockService.removeSubscription(id, email);
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3Jlc3RvY2stbm90aWZpY2F0aW9ucy9baWRdL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBSUEsd0JBV0M7QUFYTSxLQUFLLFVBQVUsTUFBTSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDaEUsTUFBTSxjQUFjLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQWlCLFNBQVMsQ0FBQyxDQUFBO0lBQ25FLE1BQU0sRUFBRSxFQUFFLEVBQUUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFBO0lBQ3pCLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBUSxHQUFHLENBQUMsSUFBSSxDQUFBO0lBRS9CLElBQUksQ0FBQztRQUNELE1BQU0sY0FBYyxDQUFDLGtCQUFrQixDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUNsRCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUE7SUFDL0IsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDYixHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQTtJQUNwRCxDQUFDO0FBQ0wsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7O0VBYUUifQ==