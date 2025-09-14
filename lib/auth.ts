// Authentication service connecting to the backend API

export interface User {
  id: string
  email: string
  tenantId: string
  tenantName: string
  role: "admin" | "member"
  plan: "free" | "pro"
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

// const API_BASE_URL = "https://yardstick-back.vercel.app";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export class AuthService {
  private static instance: AuthService
  private currentUser: User | null = null
  private token: string | null = null

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async login(email: string, password: string): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      console.log('Login response data:', data);
      
      // Save the token
      this.token = data.token;
      
      // Extract user data from response
      const user: User = {
        id: data.user.id,
        email: data.user.email,
        tenantId: data.user.tenantId._id,
        tenantName: data.user.tenantId.slug,
        role: data.user.role,
        plan: data.user.tenantId.plan
      };
      
      this.currentUser = user;

      // Store in localStorage for persistence
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_user", JSON.stringify(user));
        localStorage.setItem("auth_token", this.token as string);
      }

      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    // Clear user data and token
    this.currentUser = null;
    this.token = null;

    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth_token");
    }
  }

  async upgradePlanApi(tenantName: string): Promise<User> {
    console.log('Upgrading plan for tenant:', tenantName);
    if (!this.currentUser) {
      throw new Error("Not authenticated");
    }

    if (this.currentUser.role !== "admin") {
      throw new Error("Only administrators can upgrade the plan");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/tenants/${tenantName}/upgrade`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Plan upgrade failed11');
      }

      const data = await response.json();
      
      // Update user with new plan information
      const updatedUser = { ...this.currentUser, plan: data.plan };
      console.log('==============Updated user after upgrade:=======================', updatedUser);
      this.currentUser = updatedUser;

      // Update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_user", JSON.stringify(updatedUser));
      }

      return updatedUser;
    } catch (error) {
      console.error('Upgrade plan error:', error);
      throw error;
    }
  }
  
  async inviteUser(tenantName: string, email: string, role: string): Promise<any> {

    console.log('Inviting user to tenant:', tenantName, email, role);
    if (!this.currentUser) {
      throw new Error("Not authenticated");
    }

    if (this.currentUser.role !== "admin") {
      throw new Error("Only administrators can invite users");
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/tenants/${tenantName}/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, role })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'User invitation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Invite user error:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    if (this.currentUser) {
      return this.currentUser;
    }

    // Try to restore from localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("auth_user");
      const storedToken = localStorage.getItem("auth_token");
      
      if (stored && storedToken) {
        try {
          this.currentUser = JSON.parse(stored);
          this.token = storedToken;
          return this.currentUser;
        } catch {
          localStorage.removeItem("auth_user");
          localStorage.removeItem("auth_token");
        }
      }
    }

    return null;
  }

  getToken(): string | null {
    if (this.token) {
      return this.token;
    }

    // Try to restore token from localStorage
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("auth_token");
      if (storedToken) {
        this.token = storedToken;
        return this.token;
      }
    }

    return null;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null && this.getToken() !== null;
  }
}
