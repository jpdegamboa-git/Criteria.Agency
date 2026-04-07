CREATE INDEX "artifacts_project_id_idx" ON "artifacts" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "comments_project_id_idx" ON "comments" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "expected_payments_client_id_idx" ON "expected_payments" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "expected_payments_status_idx" ON "expected_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoices_entity_id_idx" ON "invoices" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "projects_client_id_idx" ON "projects" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "transactions_date_idx" ON "transactions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "transactions_client_id_idx" ON "transactions" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "transactions_category_idx" ON "transactions" USING btree ("category");--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_email_unique" UNIQUE("email");