import { DevMode } from '../classes/DevMode.mjs';

/**
 * Automatically open registered Documents
 *
 */
export default function autoOpenDocuments() {
  const registered = game.settings.get(DevMode.MODULE_ID, DevMode.SETTINGS.autoOpenDocuments);

  for ( const document of registered ) {
    const collectionName = foundry.documents["Base" + document.type].collectionName;
    const collection = game[collectionName];
    const toRender = collection.get(document.id);
    if ( !toRender ) {
      DevMode.log(false, `Could not find ${document.type} with ID ${document.id}`);
      continue;
    }
    toRender.sheet.render(true);
  }
}
