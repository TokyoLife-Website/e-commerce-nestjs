import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateWebSocketTables1712345678901 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create chat_messages table
    await queryRunner.createTable(
      new Table({
        name: 'chat_messages',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'senderId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'receiverId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['text', 'image', 'file'],
            default: "'text'",
          },
          {
            name: 'roomId',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'isRead',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create notifications table
    await queryRunner.createTable(
      new Table({
        name: 'notifications',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'userId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'message',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['info', 'success', 'warning', 'error'],
            default: "'info'",
          },
          {
            name: 'data',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'isRead',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create ai_conversations table
    await queryRunner.createTable(
      new Table({
        name: 'ai_conversations',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'userId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'summary',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create ai_chat_messages table
    await queryRunner.createTable(
      new Table({
        name: 'ai_chat_messages',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'userId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'conversationId',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'userMessage',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'aiResponse',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign key constraints
    await queryRunner.createForeignKey(
      'chat_messages',
      new TableForeignKey({
        columnNames: ['senderId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'chat_messages',
      new TableForeignKey({
        columnNames: ['receiverId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'notifications',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'ai_conversations',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'ai_chat_messages',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'ai_chat_messages',
      new TableForeignKey({
        columnNames: ['conversationId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'ai_conversations',
        onDelete: 'CASCADE',
      }),
    );

    // Add indexes for better performance
    await queryRunner.query(
      'CREATE INDEX idx_chat_messages_sender_receiver ON chat_messages(senderId, receiverId)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_chat_messages_room ON chat_messages(roomId)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_notifications_user ON notifications(userId)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_notifications_read ON notifications(isRead)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_ai_conversations_user ON ai_conversations(userId)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_ai_chat_messages_conversation ON ai_chat_messages(conversationId)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    const chatMessagesTable = await queryRunner.getTable('chat_messages');
    const notificationsTable = await queryRunner.getTable('notifications');
    const aiConversationsTable = await queryRunner.getTable('ai_conversations');
    const aiChatMessagesTable = await queryRunner.getTable('ai_chat_messages');

    if (chatMessagesTable) {
      const foreignKeys = chatMessagesTable.foreignKeys;
      await Promise.all(
        foreignKeys.map((foreignKey) =>
          queryRunner.dropForeignKey('chat_messages', foreignKey),
        ),
      );
    }

    if (notificationsTable) {
      const foreignKeys = notificationsTable.foreignKeys;
      await Promise.all(
        foreignKeys.map((foreignKey) =>
          queryRunner.dropForeignKey('notifications', foreignKey),
        ),
      );
    }

    if (aiConversationsTable) {
      const foreignKeys = aiConversationsTable.foreignKeys;
      await Promise.all(
        foreignKeys.map((foreignKey) =>
          queryRunner.dropForeignKey('ai_conversations', foreignKey),
        ),
      );
    }

    if (aiChatMessagesTable) {
      const foreignKeys = aiChatMessagesTable.foreignKeys;
      await Promise.all(
        foreignKeys.map((foreignKey) =>
          queryRunner.dropForeignKey('ai_chat_messages', foreignKey),
        ),
      );
    }

    // Drop tables
    await queryRunner.dropTable('ai_chat_messages');
    await queryRunner.dropTable('ai_conversations');
    await queryRunner.dropTable('notifications');
    await queryRunner.dropTable('chat_messages');
  }
}
