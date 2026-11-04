ALTER TABLE "disputes" ADD COLUMN "order_item_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "disputes_order_item_id_idx" ON "disputes" USING btree ("order_item_id");