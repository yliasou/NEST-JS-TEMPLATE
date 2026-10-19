import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiExtraModels, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { normalizeLocale, translate } from "../common/i18n";
import { Roles } from "../common/rbac/roles.decorator";
import { MARKETING_PERMISSIONS, RequirePermission } from "../admin/access";
import { successResponse } from "../common/utils/response.util";
import { AnnoncesService } from "./annonces.service";
import {
  ApiCreateAnnonce,
  ApiUpdateAnnonce,
} from "./decorators/api-annonces.decorator";
import { AnnonceResponseSchemaDto } from "./dto/annonce-response.dto";
import { CreateAnnonceDto } from "./dto/create-annonce.dto";
import { UpdateAnnonceDto } from "./dto/update-annonce.dto";
import { type AuthedRequest } from "../common/auth/authed-request";

@ApiTags("Admin — Annonces")
@ApiBearerAuth()
@ApiExtraModels(CreateAnnonceDto, UpdateAnnonceDto, AnnonceResponseSchemaDto)
@Roles(Role.ADMIN)
@Controller("admin/annonces")
export class AdminAnnoncesController {
  constructor(private readonly annoncesService: AnnoncesService) {}

  @Post()
  @RequirePermission(MARKETING_PERMISSIONS.ANNONCES_CREATE)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateAnnonce()
  async create(@Req() req: AuthedRequest, @Body() dto: CreateAnnonceDto) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const data = await this.annoncesService.create(dto);
    return successResponse(translate(locale, "annonceCreated"), data, locale);
  }

  @Patch(":id")
  @RequirePermission(MARKETING_PERMISSIONS.ANNONCES_UPDATE)
  @ApiUpdateAnnonce()
  async update(
    @Req() req: AuthedRequest,
    @Param("id") id: string,
    @Body() dto: UpdateAnnonceDto,
  ) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const data = await this.annoncesService.update(id, dto, locale);
    return successResponse(translate(locale, "annonceUpdated"), data, locale);
  }
}
