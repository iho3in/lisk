/*
 * Copyright © 2018 Lisk Foundation
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Unless otherwise agreed in a custom licensing agreement with the Lisk Foundation,
 * no part of this software, including this file, may be copied, modified,
 * propagated, or distributed except according to the terms contained in the
 * LICENSE file.
 *
 * Removal or modification of this copyright notice is prohibited.
 */
/* Lisk Memory Tables
 *
 */

/*
  DESCRIPTION: ?

  PARAMETERS: ?
*/

SELECT COUNT(*)::int
FROM mem_accounts
WHERE "blockId" = (SELECT "id" FROM "blocks" ORDER BY "height" DESC LIMIT 1);
