// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module, type Provider } from '@nestjs/common';
import { AgentsModule } from '@/agents/agents.module';
import { KernelService } from './service/kernel.service';
import { KERNEL_ORIGIN_ADAPTER } from './adapters/kernel-origin-adapter.interface';
import { WebhookProviderHandlerRegistry } from './adapters/webhook/providers/webhook-provider-handler.registry';
import {
  KernelOriginAdapterRegistry,
  type KernelOriginAdapter,
  WebhookKernelOriginAdapter,
  ChatKernelOriginAdapter,
} from './adapters';

@Module({
  imports: [AgentsModule],
  providers: [
    KernelService,
    KernelOriginAdapterRegistry,
    WebhookProviderHandlerRegistry,
    {
      provide: KERNEL_ORIGIN_ADAPTER,
      useClass: WebhookKernelOriginAdapter,
      multi: true,
    } as Provider<KernelOriginAdapter>,
    {
      provide: KERNEL_ORIGIN_ADAPTER,
      useClass: ChatKernelOriginAdapter,
      multi: true,
    } as Provider<KernelOriginAdapter>,
  ],
  exports: [KernelService],
})
export class KernelModule { }
