import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAddressTables1734863294898 implements MigrationInterface {
    name = 'CreateAddressTables1734863294898'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`province\` (\`id\` int NOT NULL AUTO_INCREMENT, \`provinceId\` int NOT NULL, \`name\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_e24e556d64dde9bd56bcd8a432\` (\`provinceId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`district\` (\`id\` int NOT NULL AUTO_INCREMENT, \`districtId\` int NOT NULL, \`name\` varchar(255) NOT NULL, \`provinceId\` int NULL, UNIQUE INDEX \`IDX_dca19338de91cc1f51929ec971\` (\`districtId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`ward\` (\`id\` int NOT NULL AUTO_INCREMENT, \`wardId\` int NULL, \`name\` varchar(255) NOT NULL, \`districtId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`address\` (\`id\` int NOT NULL AUTO_INCREMENT, \`detail\` varchar(255) NOT NULL, \`isDefault\` tinyint NOT NULL DEFAULT 0, \`type\` enum ('HOME', 'OFFICE', 'OTHER') NOT NULL DEFAULT 'HOME', \`userId\` int NULL, \`provinceId\` int NULL, \`districtId\` int NULL, \`wardId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`district\` ADD CONSTRAINT \`FK_23a21b38208367a242b1dd3a424\` FOREIGN KEY (\`provinceId\`) REFERENCES \`province\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`ward\` ADD CONSTRAINT \`FK_19a3bc9b3be291e8b9bc2bb623b\` FOREIGN KEY (\`districtId\`) REFERENCES \`district\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`address\` ADD CONSTRAINT \`FK_d25f1ea79e282cc8a42bd616aa3\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`address\` ADD CONSTRAINT \`FK_6b08d352c02976faa2b4b2933c3\` FOREIGN KEY (\`provinceId\`) REFERENCES \`province\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`address\` ADD CONSTRAINT \`FK_89e09cf52a27eec4a04378bbdda\` FOREIGN KEY (\`districtId\`) REFERENCES \`district\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`address\` ADD CONSTRAINT \`FK_36a5ea1bf9f1a45fc696628bda2\` FOREIGN KEY (\`wardId\`) REFERENCES \`ward\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`address\` DROP FOREIGN KEY \`FK_36a5ea1bf9f1a45fc696628bda2\``);
        await queryRunner.query(`ALTER TABLE \`address\` DROP FOREIGN KEY \`FK_89e09cf52a27eec4a04378bbdda\``);
        await queryRunner.query(`ALTER TABLE \`address\` DROP FOREIGN KEY \`FK_6b08d352c02976faa2b4b2933c3\``);
        await queryRunner.query(`ALTER TABLE \`address\` DROP FOREIGN KEY \`FK_d25f1ea79e282cc8a42bd616aa3\``);
        await queryRunner.query(`ALTER TABLE \`ward\` DROP FOREIGN KEY \`FK_19a3bc9b3be291e8b9bc2bb623b\``);
        await queryRunner.query(`ALTER TABLE \`district\` DROP FOREIGN KEY \`FK_23a21b38208367a242b1dd3a424\``);
        await queryRunner.query(`DROP TABLE \`address\``);
        await queryRunner.query(`DROP TABLE \`ward\``);
        await queryRunner.query(`DROP INDEX \`IDX_dca19338de91cc1f51929ec971\` ON \`district\``);
        await queryRunner.query(`DROP TABLE \`district\``);
        await queryRunner.query(`DROP INDEX \`IDX_e24e556d64dde9bd56bcd8a432\` ON \`province\``);
        await queryRunner.query(`DROP TABLE \`province\``);
    }

}
