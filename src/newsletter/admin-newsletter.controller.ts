import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { normalizeLocale, translate } from "../common/i18n";
import { Roles } from "../common/rbac/roles.decorator";
import { MARKETING_PERMISSIONS, RequirePermission } from "../admin/access";
import {
  paginatedResponse,
  successResponse,
} from "../common/utils/response.util";
import {
  ApiListNewsletterSubscribers,
  ApiUpdateNewsletterSubscriber,
} from "./decorators/api-newsletter.decorator";
import { NewsletterSubscribersQueryDto } from "./dto/newsletter-subscribers-query.dto";
import { UpdateNewsletterSubscriberDto } from "./dto/update-newsletter-subscriber.dto";
import { NewsletterService } from "./newsletter.service";
import { type AuthedRequest } from "../common/auth/authed-request";

@ApiTags("Admin — Newsletter")
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller("admin/newsletter")
export class AdminNewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Get("subscribers")
  @RequirePermission(MARKETING_PERMISSIONS.NEWSLETTER_VIEW)
  @ApiListNewsletterSubscribers()
  async findAllSubscribers(
    @Req() req: AuthedRequest,
    @Query() query: NewsletterSubscribersQueryDto,
  ) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const { data, pagination } =
      await this.newsletterService.findAllSubscribers(query);
    return paginatedResponse(
      data,
      pagination,
      translate(locale, "newsletterSubscribersFetched"),
      locale,
    );
  }

  @Patch("subscribers/:id")
  @RequirePermission(MARKETING_PERMISSIONS.NEWSLETTER_UPDATE)
  @ApiUpdateNewsletterSubscriber()
  async updateSubscriber(
    @Req() req: AuthedRequest,
    @Param("id") id: string,
    @Body() dto: UpdateNewsletterSubscriberDto,
  ) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const data = await this.newsletterService.updateSubscriber(id, dto, locale);
    return successResponse(
      translate(locale, "newsletterSubscriberUpdated"),
      data,
      locale,
    );
  }
}
