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
exports.I18nService = void 0;
const common_1 = require("@nestjs/common");
const nestjs_i18n_1 = require("nestjs-i18n");
let I18nService = class I18nService {
    i18n;
    agents = {
        requiredName: () => this.i18n.t('agents.agent_required_name'),
        agentNotFound: () => this.i18n.t('agents.agent_not_found'),
        intentNotFound: () => this.i18n.t('agents.intent_not_found'),
        agentIntentNotFound: () => this.i18n.t('agents.agent_intent_not_found'),
        agentRequiredId: () => this.i18n.t('agents.agent_required_id'),
    };
    chats = {
        chatNotFound: () => this.i18n.t('chats.chat_not_found'),
    };
    common = {
        recordAlreadyExists: () => this.i18n.t('common.record_already_exists'),
        recordNotFound: () => this.i18n.t('common.record_not_found'),
        requestCouldNotBeProcessed: () => this.i18n.t('common.request_could_not_be_processed'),
        serviceUnavailable: () => this.i18n.t('common.service_unavailable'),
        rateLimitExceeded: () => this.i18n.t('common.rate_limit_exceeded'),
        jsonResponseFormatError: () => this.i18n.t('common.json_response_format_error'),
        insufficientQuota: () => this.i18n.t('common.insufficient_quota'),
    };
    jobs = {
        jobNotFound: () => this.i18n.t('jobs.job_not_found'),
        jobIdNotFound: () => this.i18n.t('jobs.job_id_not_found'),
        jobStatusUpdateFailed: () => this.i18n.t('jobs.job_status_update_failed'),
    };
    skills = {
        skillAlreadyRegistered: () => this.i18n.t('skills.skill_already_registered'),
        skillNotRegistered: () => this.i18n.t('skills.skill_not_registered'),
        skillNotFound: () => this.i18n.t('skills.skill_not_found'),
    };
    storage = {
        storageDeleteFailed: () => this.i18n.t('storage.storage_delete_failed'),
        storageReadFailed: () => this.i18n.t('storage.storage_read_failed'),
        storageWriteFailed: () => this.i18n.t('storage.storage_write_failed'),
        storageInitializationFailed: () => this.i18n.t('storage.storage_initialization_failed'),
    };
    constructor(i18n) {
        this.i18n = i18n;
    }
};
exports.I18nService = I18nService;
exports.I18nService = I18nService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [nestjs_i18n_1.I18nService])
], I18nService);
//# sourceMappingURL=i18n.service.js.map