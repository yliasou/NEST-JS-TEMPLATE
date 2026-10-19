import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiExtraModels, ApiTags } from "@nestjs/swagger";
import { Public } from "../auth/shared/decorators/public.decorator";
import { normalizeLocale, translate } from "../common/i18n";
import {
  paginatedResponse,
  successResponse,
} from "../common/utils/response.util";
import { AnnoncesService } from "./annonces.service";
import {
  ApiGetAnnonce,
  ApiGetLatestUnreadAnnonce,
  ApiListAnnonces,
  ApiMarkAnnonceRead,
} from "./decorators/api-annonces.decorator";
import {
  AnnonceLatestUnreadResponseSchemaDto,
  AnnonceResponseSchemaDto,
  AnnoncesPaginatedResponseSchemaDto,
} from "./dto/annonce-response.dto";
import { AnnoncesQueryDto } from "./dto/annonces-query.dto";
import {
  type AuthedRequest,
  requireUserId,
} from "../common/auth/authed-request";

@ApiTags("Annonces")
@ApiExtraModels(
  AnnoncesQueryDto,
  AnnonceResponseSchemaDto,
  AnnonceLatestUnreadResponseSchemaDto,
  AnnoncesPaginatedResponseSchemaDto,
)
@Controller("annonces")
export class AnnoncesController {
  constructor(private readonly annoncesService: AnnoncesService) {}

  @Public()
  @Get()
  @ApiListAnnonces()
  async findAll(@Req() req: AuthedRequest, @Query() query: AnnoncesQueryDto) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const { data, pagination } = await this.annoncesService.findAll(
      query,
      req.user?.role,
    );
    return paginatedResponse(
      data,
      pagination,
      translate(locale, "annoncesFetched"),
      locale,
    );
  }

  @Get("latest-unread")
  @ApiBearerAuth()
  @ApiGetLatestUnreadAnnonce()
  async findLatestUnread(@Req() req: AuthedRequest) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const userId = requireUserId(req);
    const data = await this.annoncesService.findLatestUnread(userId);
    return successResponse(
      translate(
        locale,
        data ? "latestUnreadAnnonceFetched" : "noUnreadAnnonce",
      ),
      data,
      locale,
    );
  }

  @Patch(":id/read")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiMarkAnnonceRead()
  async markAsRead(@Req() req: AuthedRequest, @Param("id") id: string) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const userId = requireUserId(req);
    const data = await this.annoncesService.markAsRead(
      id,
      userId,
      locale,
      req.user?.role,
    );
    return successResponse(
      translate(locale, "annonceMarkedAsRead"),
      data,
      locale,
    );
  }

  @Public()
  @Get(":id")
  @ApiGetAnnonce()
  async findOne(@Req() req: AuthedRequest, @Param("id") id: string) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const data = await this.annoncesService.findOne(id, locale, req.user?.role);
    return successResponse(translate(locale, "annonceFetched"), data, locale);
  }
}
