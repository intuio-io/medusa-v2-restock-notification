"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESTOCK_MODULE = void 0;
// index.ts
const utils_1 = require("@medusajs/framework/utils");
const restock_1 = __importDefault(require("./services/restock"));
exports.RESTOCK_MODULE = "restock";
exports.default = (0, utils_1.Module)(exports.RESTOCK_MODULE, {
    service: restock_1.default
});
__exportStar(require("./services/restock"), exports);
__exportStar(require("./models/restock-subscription"), exports);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxXQUFXO0FBQ1gscURBQWtEO0FBQ2xELGlFQUErQztBQUVsQyxRQUFBLGNBQWMsR0FBRyxTQUFTLENBQUE7QUFHdkMsa0JBQWUsSUFBQSxjQUFNLEVBQUMsc0JBQWMsRUFBRTtJQUNsQyxPQUFPLEVBQUUsaUJBQWM7Q0FDMUIsQ0FBQyxDQUFBO0FBRUYscURBQWtDO0FBQ2xDLGdFQUE2QyJ9