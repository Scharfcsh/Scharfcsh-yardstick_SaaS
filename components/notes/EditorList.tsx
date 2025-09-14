"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/auth-provider";
import { AuthService } from "@/lib/auth";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2, Mail, UserCircle2, Shield } from "lucide-react";

// API base URL
// const API_BASE_URL = "https://yardstick-back.vercel.app";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface User {
	id: string;
	email: string;
	role: string;
	tenantId: string;
}

const EditorList = () => {
	const { user } = useAuth();
	const [users, setUsers] = useState<User[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Invite modal state
	const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
	const [newUserEmail, setNewUserEmail] = useState("");
	const [newUserRole, setNewUserRole] = useState("member");
	const [isInviting, setIsInviting] = useState(false);
	const [inviteError, setInviteError] = useState<string | null>(null);

	// Fetch users from API
	const fetchUsers = async () => {
		setIsLoading(true);
		setError(null);

		try {
			const authService = AuthService.getInstance();
			const token = authService.getToken();

			if (!token) {
				throw new Error("Authentication token not found");
			}

			const response = await fetch(`${API_BASE_URL}/users`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error("Failed to fetch users");
			}

			const data = await response.json();
			setUsers(data.users);
		} catch (err) {
			console.error("Error fetching users:", err);
			setError(
				typeof err === "object" && err !== null && "message" in err
					? (err as Error).message
					: "Failed to load users. Please try again."
			);
		} finally {
			setIsLoading(false);
		}
	};

	// Invite new user
	const handleInviteUser = async () => {
		if (!user) return;

		setIsInviting(true);
		setInviteError(null);

		try {
			const authService = AuthService.getInstance();

			// Use the inviteUser method from AuthService
			await authService.inviteUser(user.tenantName, newUserEmail, newUserRole);

			// Refresh the user list
			fetchUsers();

			// Close the modal and reset form
			setIsInviteModalOpen(false);
			setNewUserEmail("");
			setNewUserRole("member");
		} catch (err) {
			console.error("Error inviting user:", err);
			setInviteError(
				typeof err === "object" && err !== null && "message" in err
					? (err as Error).message
					: "Failed to invite user. Please try again."
			);
		} finally {
			setIsInviting(false);
		}
	};

	useEffect(() => {
		fetchUsers();
	}, []);

	return (
		<div className="flex-1 flex flex-col">
			<div className="p-6 border-b border-border flex justify-between items-center">
				<h1 className="text-2xl font-semibold text-balance">Team Members</h1>
				{user?.role === "admin" && (
					<Button onClick={() => setIsInviteModalOpen(true)} className="gap-2">
						<UserPlus className="w-4 h-4" />
						Invite User
					</Button>
				)}
			</div>

			<div className="p-6">
				{isLoading ? (
					<div className="flex items-center justify-center h-40">
						<div className="text-center">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
							<p className="text-muted-foreground">
								Loading team members...
							</p>
						</div>
					</div>
				) : error ? (
					<div className="flex items-center justify-center h-40">
						<div className="text-center">
							<div className="rounded-full h-8 w-8 bg-red-500/10 flex items-center justify-center mx-auto mb-4">
								<span className="text-red-500">!</span>
							</div>
							<p className="text-red-500 mb-2">{error}</p>
							<Button onClick={fetchUsers} variant="outline" size="sm">
								Retry
							</Button>
						</div>
					</div>
				) : (
					<div className="space-y-4">
						{users.length === 0 ? (
							<p className="text-center text-muted-foreground py-8">
								No team members found.
							</p>
						) : (
							<div className="border rounded-lg overflow-hidden">
								<div className="grid grid-cols-2 bg-muted/50 p-3 text-xs font-medium text-muted-foreground">
									<div>Email</div>
									<div>Role</div>
									{/* <div className="text-right">Status</div> */}
								</div>
								{users.map((user) => (
									<div
										key={user.id}
										className="grid grid-cols-2 p-4 border-t items-center"
									>
										<div className="flex items-center gap-2">
											<Mail className="w-4 h-4 text-muted-foreground" />
											<span className="text-sm">{user.email}</span>
										</div>
										<div className="flex items-center gap-1">
											{user.role === "admin" ? (
												<Shield className="w-4 h-4 text-primary" />
											) : (
												<UserCircle2 className="w-4 h-4 text-muted-foreground" />
											)}
											<span className="text-sm capitalize">
												{user.role}
											</span>
										</div>
										{/* <div className="text-right">
											<span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
												Active
											</span>
										</div> */}
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</div>

			{/* Invite User Modal */}
			<Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Invite Team Member</DialogTitle>
						<DialogDescription>
							Send an invitation to join your team. They will receive an email
							with instructions.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<label htmlFor="email" className="text-sm font-medium">
								Email Address
							</label>
							<Input
								id="email"
								placeholder="colleague@example.com"
								value={newUserEmail}
								onChange={(e) => setNewUserEmail(e.target.value)}
								type="email"
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="role" className="text-sm font-medium">
								Role
							</label>
							<Select value={newUserRole} onValueChange={setNewUserRole}>
								<SelectTrigger id="role">
									<SelectValue placeholder="Select a role" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="member">Member</SelectItem>
									<SelectItem value="admin">Administrator</SelectItem>
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground mt-1">
								Administrators can manage team members and billing.
							</p>
						</div>

						{inviteError && (
							<div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
								<p className="text-destructive text-sm">{inviteError}</p>
							</div>
						)}
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsInviteModalOpen(false)}
							disabled={isInviting}
						>
							Cancel
						</Button>
						<Button
							onClick={handleInviteUser}
							disabled={!newUserEmail || isInviting}
							className="gap-2"
						>
							{isInviting ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									Inviting...
								</>
							) : (
								<>
									<UserPlus className="w-4 h-4" />
									Send Invitation
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default EditorList;
