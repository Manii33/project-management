export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}


export interface Project {
  id: string;
  name: string;
  description: string;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}