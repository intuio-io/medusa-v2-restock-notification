"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestockSubscription = void 0;
const core_1 = require("@mikro-orm/core");
const utils_1 = require("@medusajs/framework/utils");
let RestockSubscription = class RestockSubscription extends utils_1.BaseEntity {
    constructor() {
        super(...arguments);
        this.notified = false;
        this.created_at = new Date();
        this.updated_at = new Date();
    }
};
exports.RestockSubscription = RestockSubscription;
__decorate([
    (0, core_1.Property)(),
    __metadata("design:type", String)
], RestockSubscription.prototype, "email", void 0);
__decorate([
    (0, core_1.Property)(),
    __metadata("design:type", String)
], RestockSubscription.prototype, "variant_id", void 0);
__decorate([
    (0, core_1.Property)(),
    __metadata("design:type", String)
], RestockSubscription.prototype, "product_title", void 0);
__decorate([
    (0, core_1.Property)(),
    __metadata("design:type", String)
], RestockSubscription.prototype, "variant_title", void 0);
__decorate([
    (0, core_1.Property)({ default: false }),
    __metadata("design:type", Boolean)
], RestockSubscription.prototype, "notified", void 0);
__decorate([
    (0, core_1.Property)(),
    __metadata("design:type", Date)
], RestockSubscription.prototype, "created_at", void 0);
__decorate([
    (0, core_1.Property)({ onUpdate: () => new Date() }),
    __metadata("design:type", Date)
], RestockSubscription.prototype, "updated_at", void 0);
exports.RestockSubscription = RestockSubscription = __decorate([
    (0, core_1.Entity)()
], RestockSubscription);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzdG9jay1zdWJzY3JpcHRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbW9kZWxzL3Jlc3RvY2stc3Vic2NyaXB0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDBDQUFrRDtBQUNsRCxxREFBc0Q7QUFHL0MsSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSxrQkFBVTtJQUE1Qzs7UUFjSCxhQUFRLEdBQVksS0FBSyxDQUFBO1FBR3pCLGVBQVUsR0FBUyxJQUFJLElBQUksRUFBRSxDQUFBO1FBRzdCLGVBQVUsR0FBUyxJQUFJLElBQUksRUFBRSxDQUFBO0lBQ2pDLENBQUM7Q0FBQSxDQUFBO0FBckJZLGtEQUFtQjtBQUU1QjtJQURDLElBQUEsZUFBUSxHQUFFOztrREFDRztBQUdkO0lBREMsSUFBQSxlQUFRLEdBQUU7O3VEQUNRO0FBR25CO0lBREMsSUFBQSxlQUFRLEdBQUU7OzBEQUNXO0FBR3RCO0lBREMsSUFBQSxlQUFRLEdBQUU7OzBEQUNXO0FBR3RCO0lBREMsSUFBQSxlQUFRLEVBQUMsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUM7O3FEQUNKO0FBR3pCO0lBREMsSUFBQSxlQUFRLEdBQUU7OEJBQ0MsSUFBSTt1REFBYTtBQUc3QjtJQURDLElBQUEsZUFBUSxFQUFDLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksSUFBSSxFQUFFLEVBQUUsQ0FBQzs4QkFDN0IsSUFBSTt1REFBYTs4QkFwQnBCLG1CQUFtQjtJQUQvQixJQUFBLGFBQU0sR0FBRTtHQUNJLG1CQUFtQixDQXFCL0IifQ==