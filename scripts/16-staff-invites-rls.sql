-- Enable RLS on new tables
ALTER TABLE staff_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_templates ENABLE ROW LEVEL SECURITY;

-- Staff invitations policies
CREATE POLICY "Users can view invitations for their tenants"
  ON staff_invitations FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can create invitations"
  ON staff_invitations FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() 
      AND is_active = true 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update invitations"
  ON staff_invitations FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() 
      AND is_active = true 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can delete invitations"
  ON staff_invitations FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() 
      AND is_active = true 
      AND role IN ('owner', 'admin')
    )
  );

-- Activity log policies
CREATE POLICY "Users can view activity for their tenants"
  ON activity_log FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can create activity logs"
  ON activity_log FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- QR templates policies
CREATE POLICY "Users can view QR templates for their tenants"
  ON qr_templates FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can manage QR templates"
  ON qr_templates FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() 
      AND is_active = true 
      AND role IN ('owner', 'admin')
    )
  );
