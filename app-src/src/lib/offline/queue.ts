/**
 * Fila de upload offline para o Checkin.
 * Usa IndexedDB via biblioteca `idb` para persistir fotos localmente
 * quando o dispositivo está sem internet.
 */
import { openDB, type IDBPDatabase } from 'idb'
import type { FotoOffline } from '@/types'

const DB_NAME = 'ooh-manager-offline'
const DB_VERSION = 1
const STORE_FOTOS = 'fotos_pendentes'

type OOHDatabase = {
  [STORE_FOTOS]: {
    key: string
    value: FotoOffline
  }
}

let db: IDBPDatabase<OOHDatabase> | null = null

async function getDB() {
  if (db) return db
  db = await openDB<OOHDatabase>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE_FOTOS)) {
        database.createObjectStore(STORE_FOTOS, { keyPath: 'id' })
      }
    },
  })
  return db
}

export async function enqueuePhoto(foto: FotoOffline): Promise<void> {
  const database = await getDB()
  await database.put(STORE_FOTOS, foto)
}

export async function getPendingPhotos(): Promise<FotoOffline[]> {
  const database = await getDB()
  return database.getAll(STORE_FOTOS)
}

export async function removePhoto(id: string): Promise<void> {
  const database = await getDB()
  await database.delete(STORE_FOTOS, id)
}

export async function getPendingCount(): Promise<number> {
  const database = await getDB()
  return database.count(STORE_FOTOS)
}

/**
 * Dispara o sync de todas as fotos pendentes.
 * Chamado quando o app detecta que voltou online.
 */
export async function syncPendingPhotos(
  onProgress?: (synced: number, total: number) => void
): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingPhotos()
  let synced = 0
  let failed = 0

  for (const foto of pending) {
    try {
      const formData = new FormData()
      formData.append('file', foto.blob, `${foto.id}.jpg`)
      formData.append('tipo', foto.tipo)
      formData.append('capturado_em', foto.capturado_em)
      formData.append('device_id', foto.device_id)
      if (foto.latitude != null) formData.append('latitude', String(foto.latitude))
      if (foto.longitude != null) formData.append('longitude', String(foto.longitude))
      if (foto.precisao_m != null) formData.append('precisao_m', String(foto.precisao_m))

      const res = await fetch(`/api/os/${foto.os_id}/fotos`, {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        await removePhoto(foto.id)
        synced++
      } else {
        failed++
      }
    } catch {
      failed++
    }

    onProgress?.(synced, pending.length)
  }

  return { synced, failed }
}
