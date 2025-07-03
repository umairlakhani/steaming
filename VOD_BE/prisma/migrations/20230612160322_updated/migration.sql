-- CreateTable
CREATE TABLE "AdVideo" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "length" INTEGER NOT NULL DEFAULT 0,
    "size" INTEGER NOT NULL,
    "videoId" TEXT NOT NULL,
    "processing" BOOLEAN NOT NULL DEFAULT true,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "videoUrl" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdVideo_videoId_key" ON "AdVideo"("videoId");

-- AddForeignKey
ALTER TABLE "AdVideo" ADD CONSTRAINT "AdVideo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
