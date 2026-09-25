import { FarmerProfile, UserRole, DeveloperSession } from '../types';
import { MockStore } from '../data/mockStore';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface AuthSession {
  role: UserRole;
  farmerId?: string;
  farmerPhone?: string;
  adminEmail?: string;
  storageOwnerEmail?: string;
  storageOwnerFacilityId?: string;
  storageOwnerName?: string;
  isAuthenticated: boolean;
  isDemo?: boolean;
  demoPortal?: 'farmer' | 'admin' | 'officer' | 'storage_owner';
}

const AUTH_KEY = 'fg_auth_session_v2';

// Authorized Admin / Officer accounts with credentials
export const AUTHORIZED_ADMINS = [
  {
    email: 'admin@hackara.in',
    password: 'admin2026',
    designation: 'Agricultural System Administrator',
  },
  {
    email: 'tao.niphad@krishi.maharashtra.gov.in',
    password: 'admin2026',
    designation: 'Taluka Agriculture Officer (TAO)',
  },
];

// Authorized Cold Storage Owners with assigned facilities
export const AUTHORIZED_STORAGE_OWNERS = [
  {
    email: 'owner.sahyadri@coldstorage.in',
    password: 'owner2026',
    facilityId: 'cs-001',
    facilityName: 'Sahyadri Agro Cold Storage & Integrated Packhouse',
    ownerName: 'Vilas Shinde (Manager: S. Patil)',
    phone: '9822145566',
  },
  {
    email: 'owner.lasalgaon@coldstorage.in',
    password: 'owner2026',
    facilityId: 'cs-002',
    facilityName: 'Lasalgaon Kisan Shetkari Cold Chain Hub',
    ownerName: 'Sanjay Borkar',
    phone: '9422289110',
  },
  {
    email: 'owner.godavari@coldstorage.in',
    password: 'owner2026',
    facilityId: 'cs-003',
    facilityName: 'Godavari Agro Warehouse & Cold Logistics',
    ownerName: 'Mahesh Deshmukh',
    phone: '9890123477',
  },
];

let currentSessionId: string | null = null;

export const AuthService = {
  getCurrentSession(): AuthSession {
    try {
      const stored = sessionStorage.getItem(AUTH_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch {}
    return {
      role: 'farmer',
      farmerId: undefined,
      farmerPhone: undefined,
      isAuthenticated: false,
    };
  },

  setSession(session: AuthSession) {
    try {
      sessionStorage.setItem(AUTH_KEY, JSON.stringify(session));
    } catch {}
  },

  isDemoSession(): boolean {
    const session = this.getCurrentSession();
    return Boolean(session.isDemo && session.isAuthenticated);
  },

  /**
   * Establish a safe, isolated Demo Session for evaluating judges.
   * Completely separated from real user credentials and production DB.
   */
  loginAsDemo(portal: 'farmer' | 'admin' | 'officer' | 'storage_owner'): AuthSession {
    let session: AuthSession;

    switch (portal) {
      case 'farmer':
        session = {
          role: 'farmer',
          farmerId: 'DEMO-FARMER-01',
          farmerPhone: '9822012345',
          isAuthenticated: true,
          isDemo: true,
          demoPortal: 'farmer',
        };
        MockStore.setActiveFarmerId('DEMO-FARMER-01');
        break;

      case 'admin':
        session = {
          role: 'admin',
          adminEmail: 'demo.admin@hackara.in',
          isAuthenticated: true,
          isDemo: true,
          demoPortal: 'admin',
        };
        break;

      case 'officer':
        session = {
          role: 'admin',
          adminEmail: 'demo.officer@krishi.maharashtra.gov.in',
          isAuthenticated: true,
          isDemo: true,
          demoPortal: 'officer',
        };
        break;

      case 'storage_owner':
        session = {
          role: 'storage_owner',
          storageOwnerEmail: 'demo.storage@sahyadriagro.in',
          storageOwnerFacilityId: 'cs-001',
          storageOwnerName: 'Demo Facility Manager (Sahyadri Agro)',
          isAuthenticated: true,
          isDemo: true,
          demoPortal: 'storage_owner',
        };
        break;

      default:
        session = {
          role: 'farmer',
          farmerId: 'DEMO-FARMER-01',
          farmerPhone: '9822012345',
          isAuthenticated: true,
          isDemo: true,
          demoPortal: 'farmer',
        };
    }

    this.setSession(session);
    return session;
  },

  async logout(): Promise<void> {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem('fg_farmer_token');
      currentSessionId = null;
    } catch (e) {
      console.warn('Logout error:', e);
    }
  },

  /**
   * Request genuine OTP via 2Factor SMS API.
   * Strictly verifies that the mobile number belongs to an authorized registered farmer
   * before triggering SMS dispatch. Zero self-registration.
   */
  async requestFarmerOTP(phone: string): Promise<{
    success: boolean;
    error?: 'EMPTY_DATABASE' | 'NOT_REGISTERED' | 'INVALID_PHONE' | 'SMS_GATEWAY_ERROR' | 'RATE_LIMIT_EXCEEDED' | 'COOLDOWN_ACTIVE' | 'SERVICE_UNCONFIGURED';
    maskedPhone?: string;
    farmer?: Partial<FarmerProfile>;
    message?: string;
    sessionId?: string;
    cooldownSeconds?: number;
  }> {
    const cleaned = phone.replace(/\D/g, '').slice(-10);
    if (!cleaned || cleaned.length < 10) {
      return { success: false, error: 'INVALID_PHONE', message: 'Please enter a valid 10-digit mobile number.' };
    }

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        return {
          success: false,
          error: data?.error || 'SMS_GATEWAY_ERROR',
          message: data?.message || 'Failed to dispatch OTP. Please try again.',
          cooldownSeconds: data?.cooldownSeconds,
        };
      }

      currentSessionId = data.sessionId;

      return {
        success: true,
        maskedPhone: data.maskedPhone,
        sessionId: data.sessionId,
        cooldownSeconds: data.cooldownSeconds,
      };
    } catch (networkErr: any) {
      console.error('Error calling /api/auth/send-otp:', networkErr);
      return {
        success: false,
        error: 'SMS_GATEWAY_ERROR',
        message: 'Could not connect to authentication service. Please verify network connection.',
      };
    }
  },

  /**
   * Verify entered OTP securely via 2Factor API on backend.
   * On successful verification, links the authenticated session to the farmer's record.
   */
  async verifyFarmerOTP(
    phone: string,
    enteredOtp: string,
    sessionId?: string
  ): Promise<{ success: boolean; farmer?: FarmerProfile; error?: string }> {
    const targetSessionId = sessionId || currentSessionId;
    const cleanToken = enteredOtp.trim().replace(/\D/g, '');

    if (!cleanToken) {
      return { success: false, error: 'Please enter the verification code received via SMS.' };
    }

    if (!targetSessionId) {
      return { success: false, error: 'OTP session expired. Please request a new verification code.' };
    }

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: targetSessionId,
          otp: cleanToken,
          phone,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        return {
          success: false,
          error: data?.message || 'Invalid or expired verification code. Please try again.',
        };
      }

      const farmer: FarmerProfile = data.farmer;

      // Establish authenticated farmer session
      const session: AuthSession = {
        role: 'farmer',
        farmerId: farmer.id,
        farmerPhone: farmer.phone,
        isAuthenticated: true,
      };
      AuthService.setSession(session);
      MockStore.setActiveFarmerId(farmer.id);

      if (data.token) {
        sessionStorage.setItem('fg_farmer_token', data.token);
      }

      return {
        success: true,
        farmer,
      };
    } catch (err: any) {
      console.error('Error during 2Factor OTP verification:', err);
      return {
        success: false,
        error: 'Verification service error. Please try again.',
      };
    }
  },

  /**
   * Fetch authenticated farmer profile from Supabase
   */
  async getAuthenticatedFarmerProfile(farmerId?: string, phone?: string): Promise<{
    success: boolean;
    farmer?: FarmerProfile;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/farmer/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmerId, phone }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && data?.farmer) {
        return { success: true, farmer: data.farmer };
      }
      return {
        success: false,
        error: data?.message || 'No registered farmer record found in official database.',
      };
    } catch (err: any) {
      console.error('Error fetching farmer profile from database:', err);
      return {
        success: false,
        error: 'Unable to connect to database service.',
      };
    }
  },

  /**
   * Authenticate officer/admin with actual credentials
   */
  loginAdmin(email: string, password: string): { success: boolean; error?: string } {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    const matchedAdmin = AUTHORIZED_ADMINS.find(
      (acc) => acc.email.toLowerCase() === trimmedEmail && acc.password === trimmedPassword
    );

    if (matchedAdmin) {
      const session: AuthSession = {
        role: 'admin',
        adminEmail: matchedAdmin.email,
        isAuthenticated: true,
      };
      AuthService.setSession(session);
      return { success: true };
    }

    return {
      success: false,
      error: 'Invalid email or password. Access restricted to authorized personnel.',
    };
  },

  /**
   * Authenticate cold storage owner with assigned facility
   */
  loginStorageOwner(email: string, password: string): { success: boolean; owner?: any; error?: string } {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    const matchedOwner = AUTHORIZED_STORAGE_OWNERS.find(
      (acc) => acc.email.toLowerCase() === trimmedEmail && acc.password === trimmedPassword
    );

    if (matchedOwner) {
      const session: AuthSession = {
        role: 'storage_owner',
        storageOwnerEmail: matchedOwner.email,
        storageOwnerFacilityId: matchedOwner.facilityId,
        storageOwnerName: matchedOwner.ownerName,
        isAuthenticated: true,
      };
      AuthService.setSession(session);
      return { success: true, owner: matchedOwner };
    }

    return {
      success: false,
      error: 'Invalid cold storage owner credentials. Please verify your email and password.',
    };
  },

  /**
   * Self-register new farmer with Name, Phone, District, and Language
   */
  async registerFarmer(data: {
    name: string;
    phone: string;
    district: string;
    taluka?: string;
    village?: string;
    primaryCrop?: string;
    preferredLanguage?: string;
    landAreaAcres?: number;
  }): Promise<{ success: boolean; farmer?: FarmerProfile; error?: string }> {
    try {
      const res = await fetch('/api/farmer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json().catch(() => null);

      if (!res.ok || !result?.success) {
        return {
          success: false,
          error: result?.message || 'Failed to register farmer profile.',
        };
      }

      // Also persist to MockStore so client side immediately has it
      const createdFarmer: FarmerProfile = {
        id: result.farmer.id || result.farmer.farmer_id || `FG-REG-${Date.now().toString().slice(-4)}`,
        name: data.name,
        phone: data.phone.replace(/\D/g, '').slice(-10),
        state: 'Maharashtra',
        district: data.district,
        taluka: data.taluka || '',
        village: data.village || '',
        primaryCrop: data.primaryCrop || 'Onion',
        landAreaAcres: data.landAreaAcres || 2.0,
        expectedHarvestQuintals: 100,
        preferredLanguage: (data.preferredLanguage as any) || 'mr',
        consentForAdvisory: true,
        registeredDate: new Date().toISOString().split('T')[0],
        status: 'Active',
      };

      const existingFarmers = MockStore.getFarmers();
      if (!existingFarmers.some((f) => f.phone === createdFarmer.phone)) {
        MockStore.saveFarmers([createdFarmer, ...existingFarmers]);
      }

      return {
        success: true,
        farmer: createdFarmer,
      };
    } catch (e: any) {
      console.error('Error calling /api/farmer/register:', e);
      return {
        success: false,
        error: 'Network error during registration. Please try again.',
      };
    }
  },

  /**
   * =========================================================================
   * SECURE DEVELOPER PORTAL AUTHENTICATION
   * Dedicated, completely isolated from public login flows.
   * =========================================================================
   */

  getDeveloperSession(): DeveloperSession {
    try {
      const stored = sessionStorage.getItem('fg_dev_session_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && parsed.role === 'developer' && parsed.isAuthenticated) {
          return parsed;
        }
      }
    } catch {}
    return {
      role: 'developer',
      developerEmail: '',
      developerId: '',
      developerName: '',
      token: '',
      isAuthenticated: false,
    };
  },

  setDeveloperSession(session: DeveloperSession) {
    try {
      sessionStorage.setItem('fg_dev_session_v1', JSON.stringify(session));
    } catch {}
  },

  logoutDeveloper() {
    try {
      sessionStorage.removeItem('fg_dev_session_v1');
    } catch {}
  },

  isDeveloperSession(): boolean {
    const session = this.getDeveloperSession();
    return Boolean(session.isAuthenticated && session.role === 'developer');
  },

  /**
   * Authenticate developer against backend authorization service
   */
  async loginDeveloper(email: string, pass: string): Promise<{
    success: boolean;
    error?: string;
    developer?: any;
  }> {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = pass.trim();

    if (!trimmedEmail || !trimmedPassword) {
      return { success: false, error: 'Developer email and password are required.' };
    }

    try {
      const res = await fetch('/api/developer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success && data?.developer) {
        const devSession: DeveloperSession = {
          role: 'developer',
          developerEmail: data.developer.email,
          developerId: data.developer.id || 'DEV-001',
          developerName: data.developer.fullName || 'Authorized Developer',
          token: data.token || `dev_tok_${Date.now()}`,
          isAuthenticated: true,
        };

        this.setDeveloperSession(devSession);
        return { success: true, developer: data.developer };
      }

      return {
        success: false,
        error: data?.message || data?.error || 'Invalid developer credentials or access not authorized.',
      };
    } catch (err: any) {
      console.error('Developer login request failed:', err);
      return {
        success: false,
        error: 'Unable to communicate with developer authorization server.',
      };
    }
  },
};

