/**
 * The models in this file are only designed to work in the
 * context of the todo-list module.
 */

import { ClassAllowed } from "@app/service/model";

/**
 * Represents the character metadata
 */
export class Character {
  emblemPath: string;
  characterId: string;
  membershipId: string;
  membershipType: number;
  light: number;
  classType: ClassAllowed;
}
