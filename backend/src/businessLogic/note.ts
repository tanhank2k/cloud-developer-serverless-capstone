import { AttachmentUtils } from '../helpers/attachmentUtils';
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import { parseUserId } from '../auth/utils';
import { NotesAccess } from '../dataLayer/notesAccess';
import { CreateNoteRequest } from '../requests/notes/CreateNoteRequest';
import { NoteItem } from '../models/notes/NoteItem';
import { UpdateNoteRequest } from '../requests/notes/UpdateNoteRequest';
import { NoteUpdate } from '../models/notes/NoteUpdate';

const notesAccess = new NotesAccess()
const logger = createLogger('todoBusiness')


export async function createNote(
    createNoteRequest: CreateNoteRequest,
    jwtToken: string
  ): Promise<NoteItem> {
  
    const itemId = uuid.v4()
    const userId = parseUserId(jwtToken)
    const newTodoItem: NoteItem = {
      noteId: itemId,
      userId: userId,
      name: createNoteRequest.name,
      description: createNoteRequest.desciption,
      createdAt: new Date().toISOString()
    }
    logger.info(`User add new todo task ${JSON.stringify(newTodoItem)}`);

    return await notesAccess.createNote(newTodoItem);
  }

  
export async function deleteNote(
  noteId: string,
  jwtToken: string
): Promise<NoteItem> {

  const userId = parseUserId(jwtToken)
  logger.info(`User delete 1 note item: ${noteId}`);

  return await notesAccess.deleteNote(
    noteId,
    userId
  )
}


export async function getNotesForUser(
  jwtToken: string
): Promise<NoteItem[]> {

  const userId = parseUserId(jwtToken)
  return await notesAccess.getAllNotes(userId)
}


export async function updateNote(
  noteId: string,
  updateNoteRequest: UpdateNoteRequest,
  jwtToken: string
): Promise<void> {

  const userId = parseUserId(jwtToken)
  const updateItem: NoteUpdate = {...updateNoteRequest}
  logger.info(`User update information of note item: ${JSON.stringify(updateItem)}`);

  await notesAccess.updateNote(noteId, userId, updateItem)
}
  

export async function createAttachmentPresignedUrl(
  noteId: string,
  jwtToken: string
): Promise<string> {
  AttachmentUtils(noteId)
  const userId = parseUserId(jwtToken)
  const uploadUrl = await notesAccess.updatePresignUrlForNoteItem(noteId, userId);
  logger.info(`Attachment Presigned Url: ${uploadUrl}`);
  return uploadUrl
}
  

