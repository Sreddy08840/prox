-- CreateIndex
CREATE INDEX "failed_messages_status_attempts_idx" ON "failed_messages"("status", "attempts");
