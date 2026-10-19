import { Injectable } from "@nestjs/common";
import type { Role } from "@prisma/client";
import type { Locale } from "../common/i18n";
import { annoncesQueryForRole } from "./constants/annonce-visibility.util";
import type { AnnoncesQueryDto } from "./dto/annonces-query.dto";
import type { CreateAnnonceDto } from "./dto/create-annonce.dto";
import type { UpdateAnnonceDto } from "./dto/update-annonce.dto";
import { AnnoncesReadStateService } from "./services/annonces-read-state.service";
import { AnnoncesReadService } from "./services/annonces-read.service";
import { AnnoncesWriteService } from "./services/annonces-write.service";

@Injectable()
export class AnnoncesService {
  constructor(
    private readonly annoncesRead: AnnoncesReadService,
    private readonly annoncesWrite: AnnoncesWriteService,
    private readonly annoncesReadState: AnnoncesReadStateService,
  ) {}

  async findAll(query: AnnoncesQueryDto, role?: Role) {
    return this.annoncesRead.findAll(annoncesQueryForRole(query, role));
  }

  async findLatestUnread(userId: string) {
    return this.annoncesRead.findLatestUnread(userId);
  }

  async markAsRead(id: string, userId: string, locale: Locale, role?: Role) {
    return this.annoncesReadState.markAsRead(id, userId, locale, role);
  }

  async findOne(id: string, locale: Locale, role?: Role) {
    return this.annoncesRead.findOne(id, locale, role);
  }

  async create(dto: CreateAnnonceDto) {
    return this.annoncesWrite.create(dto);
  }

  async update(id: string, dto: UpdateAnnonceDto, locale: Locale) {
    return this.annoncesWrite.update(id, dto, locale);
  }
}
