import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function UserTable({ users, loading, onEdit, onDelete }) {
  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-200">Admin</Badge>;
      default:
        return <Badge variant="secondary" className="dark:bg-gray-600 dark:text-gray-200">User</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200">Active</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200">Suspended</Badge>;
      default:
        return <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">Unknown</Badge>;
    }
  };

  const getSubscriptionBadge = (plan) => {
    switch (plan) {
      case 'premium':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200">Premium</Badge>;
      case 'enterprise':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200">Enterprise</Badge>;
      default:
        return <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">Basic</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-300">Loading users...</div>;
  }

  return (
    <div className="rounded-md border dark:border-purple-700">
      <Table>
        <TableHeader>
          <TableRow className="dark:border-purple-700">
            <TableHead className="dark:text-gray-200">User</TableHead>
            <TableHead className="dark:text-gray-200">Role</TableHead>
            <TableHead className="dark:text-gray-200">Status</TableHead>
            <TableHead className="dark:text-gray-200">Subscription</TableHead>
            <TableHead className="dark:text-gray-200">Joined Date</TableHead>
            <TableHead className="text-right dark:text-gray-200">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="dark:border-purple-700/50">
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.profile_photo} />
                    <AvatarFallback className="bg-purple-200 dark:bg-purple-700">
                      {user.full_name?.[0] || user.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium dark:text-white">{user.full_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{getRoleBadge(user.role)}</TableCell>
              <TableCell>{getStatusBadge(user.status)}</TableCell>
              <TableCell>{getSubscriptionBadge(user.subscription_plan)}</TableCell>
              <TableCell className="dark:text-gray-300">{format(new Date(user.created_date), "MMM dd, yyyy")}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 dark:hover:bg-purple-600/20">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="dark:bg-[#241B3A] dark:border-purple-700">
                    <DropdownMenuItem onClick={() => onEdit(user)} className="dark:text-gray-200 dark:hover:bg-purple-500/20">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit User
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(user.id)}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}