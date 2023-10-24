const AWSXRay = require("aws-xray-sdk-core");
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand, QueryCommand, UpdateCommand, DeleteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { createLogger } from '../utils/logger'
import { NoteItem } from '../models/notes/NoteItem';
import { NoteUpdate } from '../models/notes/NoteUpdate';

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic
export class NotesAccess {
  constructor(
    private readonly docClient: DynamoDBDocumentClient = createDynamoDBClient(),
    private readonly notesTable = process.env.NOTES_TABLE,
    private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET
    ) {}

  async getAllNotes(userId: string): Promise<NoteItem[]> {
    const command = new QueryCommand({
      TableName: this.notesTable,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    });
    const result = await this.docClient.send(command)

    const items = result.Items
    logger.info(`List note item of user(${userId}) is ${JSON.stringify(items)}`);
    return items as NoteItem[]
  }

  async createNote(todo: NoteItem): Promise<NoteItem> {
    const command = new PutCommand({
      TableName: this.notesTable,
      Item: todo
    })
    await this.docClient.send(command)
    logger.info(`Create successful new todo item ${JSON.stringify(todo)}`);
    return todo
  }

  async deleteNote(noteId: string, userId: string): Promise<null> {
    const command = new DeleteCommand({
      TableName: this.notesTable,
      Key: { userId, noteId: noteId }
    })
    await this.docClient.send(command)
    logger.info(`Delete successful todo item ${noteId}`);
    return null
  }

  async updateNote(noteId: string, userId: string, updateItem: NoteUpdate): Promise<void> {
    const command = new UpdateCommand({
      TableName: this.notesTable,
      Key: { userId, noteId: noteId },
      ConditionExpression: 'attribute_exists(noteId)',
      UpdateExpression: 'set #n = :n, #d = :d',
      ExpressionAttributeNames: { '#n': 'name', '#d': 'description' },
      ExpressionAttributeValues: {
        ':n': updateItem.name,
        ':d': updateItem.description,
      }
    })
    logger.info(`Update successful note item(${noteId})  ${JSON.stringify(updateItem)}`);

    await this.docClient.send(command)
  }

  async updatePresignUrlForNoteItem(noteId: string, userId: string): Promise<string> {
    const command = new UpdateCommand({
      TableName: this.notesTable,
      Key: { userId, noteId: noteId },
      ConditionExpression: 'attribute_exists(noteId)',
      UpdateExpression: 'set attachmentUrl = :attachmentUrl',
      ExpressionAttributeValues: {
        ':attachmentUrl': `https://${this.bucketName}.s3.amazonaws.com/${noteId}`
      }
    })
    await this.docClient.send(command)
    logger.info(`Presign Url For Todo Item ${noteId} successful!`);
    return `https://${this.bucketName}.s3.amazonaws.com/${noteId}`
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    const client = new AWSXRay.captureAWSv3Client(
      new DynamoDBClient({
        region: 'localhost',
        endpoint: 'http://localhost:8000'
      }))
    return DynamoDBDocumentClient.from(client);
  }
  return DynamoDBDocumentClient.from(new DynamoDBClient({}));
}
