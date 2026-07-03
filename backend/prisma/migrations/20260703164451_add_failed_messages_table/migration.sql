-- CreateTable
CREATE TABLE "failed_messages" (
    "id" UUID NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "errorMsg" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextRetry" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'FAILED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "failed_messages_pkey" PRIMARY KEY ("id")
);
