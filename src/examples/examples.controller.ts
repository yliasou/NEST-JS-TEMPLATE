import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { EXAMPLES_PERMISSIONS, RequirePermission } from "../admin/access";
import {
  type AuthedRequest,
  requireUserId,
} from "../common/auth/authed-request";
import { normalizeLocale, translate } from "../common/i18n";
import { Roles } from "../common/rbac/roles.decorator";
import {
  paginatedResponse,
  successResponse,
} from "../common/utils/response.util";
import {
  ApiCreateExample,
  ApiDeleteExample,
  ApiGetExample,
  ApiListExamples,
  ApiUpdateExample,
} from "./decorators/api-examples.decorator";
import { CreateExampleDto } from "./dto/create-example.dto";
import { ExamplesQueryDto } from "./dto/examples-query.dto";
import { UpdateExampleDto } from "./dto/update-example.dto";
import { ExamplesService } from "./examples.service";

@ApiTags("Admin — Exemples")
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller("admin/examples")
export class ExamplesController {
  constructor(private readonly examplesService: ExamplesService) {}

  @Get()
  @RequirePermission(EXAMPLES_PERMISSIONS.VIEW)
  @ApiListExamples()
  async findAll(@Req() req: AuthedRequest, @Query() query: ExamplesQueryDto) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const { data, pagination } = await this.examplesService.findAll(query);
    return paginatedResponse(
      data,
      pagination,
      translate(locale, "examplesFetched"),
      locale,
    );
  }

  @Get(":id")
  @RequirePermission(EXAMPLES_PERMISSIONS.VIEW)
  @ApiGetExample()
  async findOne(@Req() req: AuthedRequest, @Param("id") id: string) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const data = await this.examplesService.findOne(id, locale);
    return successResponse(translate(locale, "exampleFetched"), data, locale);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(EXAMPLES_PERMISSIONS.CREATE)
  @ApiCreateExample()
  async create(@Req() req: AuthedRequest, @Body() dto: CreateExampleDto) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const data = await this.examplesService.create(dto, requireUserId(req));
    return successResponse(translate(locale, "exampleCreated"), data, locale);
  }

  @Patch(":id")
  @RequirePermission(EXAMPLES_PERMISSIONS.UPDATE)
  @ApiUpdateExample()
  async update(
    @Req() req: AuthedRequest,
    @Param("id") id: string,
    @Body() dto: UpdateExampleDto,
  ) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    const data = await this.examplesService.update(
      id,
      dto,
      locale,
      requireUserId(req),
    );
    return successResponse(translate(locale, "exampleUpdated"), data, locale);
  }

  @Delete(":id")
  @RequirePermission(EXAMPLES_PERMISSIONS.DELETE)
  @ApiDeleteExample()
  async remove(@Req() req: AuthedRequest, @Param("id") id: string) {
    const locale =
      req.locale ?? normalizeLocale(req.headers.language as string);
    await this.examplesService.remove(id, locale, requireUserId(req));
    return successResponse(
      translate(locale, "exampleDeleted"),
      undefined,
      locale,
    );
  }
}
