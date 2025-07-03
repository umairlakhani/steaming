-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "channelId" INTEGER;

-- CreateTable
CREATE TABLE "dbo_forgot_password" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" VARCHAR NOT NULL,
    "is_email_sent" BOOLEAN NOT NULL,
    "is_used" BOOLEAN NOT NULL,
    "craeted_by" INTEGER NOT NULL,

    CONSTRAINT "PK_d3fe5762b6915fdbb6e8f1bb1cc" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_user_permissions" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" INTEGER NOT NULL,
    "title" VARCHAR NOT NULL,
    "is_deleted" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "PK_5e2dbf078bf3984a2f09875ddd6" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles_details" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR,
    "createdAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "PK_b1bb1a95fd848dce3f53ad1be37" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles_permissions" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR,
    "createdAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "PK_298f2c0e2ea45289aa0c4ac8a02" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_admin_details" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "first_name" VARCHAR NOT NULL,
    "last_name" VARCHAR NOT NULL,
    "email" VARCHAR NOT NULL,
    "password" VARCHAR NOT NULL,
    "token" VARCHAR,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "user_type_id" INTEGER NOT NULL,
    "is_removed" BOOLEAN NOT NULL,
    "is_password_changed" BOOLEAN NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "PK_440ad6777f0ac24368f8e634fe3" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_admin_type" (
    "id" SERIAL NOT NULL,
    "uuid" VARCHAR NOT NULL,
    "title" VARCHAR,
    "description" VARCHAR NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "PK_da96db460317a1a93efec98ea56" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IDX_1e1095c3e71474f15dc1989071" ON "roles_details"("title");

-- CreateIndex
CREATE INDEX "IDX_fd271b62508932062fb84c7d82" ON "roles_permissions"("title");

-- CreateIndex
CREATE INDEX "IDX_29182609c44b0cc63514554fc8" ON "tbl_admin_type"("title");

-- CreateIndex
CREATE INDEX "IDX_afc32cb1392aec5cee586f7b70" ON "tbl_admin_type"("description");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_user_permissions" ADD CONSTRAINT "FK_4db663fd2c54bea26b478f6a46d" FOREIGN KEY ("user_id") REFERENCES "tbl_admin_details"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
