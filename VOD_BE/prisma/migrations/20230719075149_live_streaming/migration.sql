-- CreateTable
CREATE TABLE "LiveStreaming" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "streamingId" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveStreaming_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LiveStreaming" ADD CONSTRAINT "LiveStreaming_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
