// index.ts
import { Module } from "@medusajs/framework/utils"
import RestockService from "./services/restock"

export const RESTOCK_MODULE = "restock"


export default Module(RESTOCK_MODULE, {
    service: RestockService
})

export * from "./services/restock"
export * from "./models/restock-subscription"