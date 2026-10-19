import { PartialType } from "@nestjs/swagger";
import { CreateExampleDto } from "./create-example.dto";

/** Mise à jour partielle. Au moins un champ requis. */
export class UpdateExampleDto extends PartialType(CreateExampleDto) {}
