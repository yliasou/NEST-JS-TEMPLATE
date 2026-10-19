import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../auth/shared/decorators/public.decorator";
import { normalizeLocale, translate } from "../common/i18n";
import { successResponse } from "../common/utils/response.util";
import { ApiSubscribeNewsletter } from "./decorators/api-newsletter.decorator";
import { SubscribeNewsletterDto } from "./dto/subscribe-newsletter.dto";
import { NewsletterService } from "./newsletter.service";
import { type AuthedRequest, getUserId } from "../common/auth/authed-request";

function optionalUserId(req: AuthedRequest): string | undefined {
  return getUserId(req);
}

@ApiTags("Newsletter")
@Controller("newsletter")
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Public()
  @Post("subscribe")
  @HttpCode(HttpStatus.CREATED)
  @ApiSubscribeNewsletter()
  async subscribe(
    @Req() req: AuthedRequest,
    @Body() dto: SubscribeNewsletterDto,
  ) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const userId = optionalUserId(req);
    const data = await this.newsletterService.subscribe(dto, locale, userId);
    return successResponse(
      translate(locale, "newsletterSubscribed"),
      data,
      locale,
    );
  }
}
