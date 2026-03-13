-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  share_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create organization_members table
CREATE TABLE IF NOT EXISTS public.organization_members (
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (org_id, user_id)
);

-- Modify sessions table to optionally link to an organization
ALTER TABLE public.sessions 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Helper function to check org membership without triggering RLS infinite recursion
CREATE OR REPLACE FUNCTION public.is_org_member(check_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE org_id = check_org_id AND user_id = auth.uid()
  );
$$;

-- Policies for Organizations
-- Anyone can view an organization if they are a member or created it.
CREATE POLICY "Users can view their organizations" 
ON public.organizations 
FOR SELECT USING (
  auth.uid() = created_by OR 
  public.is_org_member(id)
);

-- Any authenticated user can create an organization
CREATE POLICY "Authenticated users can create organizations" 
ON public.organizations 
FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Only creators can modify their org
CREATE POLICY "Creators can update organizations" 
ON public.organizations 
FOR UPDATE USING (auth.uid() = created_by);

-- Only creators can delete their org
CREATE POLICY "Creators can delete organizations" 
ON public.organizations 
FOR DELETE USING (auth.uid() = created_by);


-- Policies for Organization Members
-- Users can view members of orgs they belong to
CREATE POLICY "Users can view members of their organizations" 
ON public.organization_members 
FOR SELECT USING (
  auth.uid() = user_id OR
  public.is_org_member(org_id) OR
  org_id IN (SELECT id FROM public.organizations WHERE created_by = auth.uid())
);

-- Authenticated users can insert themselves into an org (joining)
CREATE POLICY "Users can join an organization" 
ON public.organization_members 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Creators can remove members
CREATE POLICY "Creators can remove members" 
ON public.organization_members 
FOR DELETE USING (
  auth.uid() = user_id OR
  org_id IN (SELECT id FROM public.organizations WHERE created_by = auth.uid())
);
