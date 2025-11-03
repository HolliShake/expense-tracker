"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmContextType {
    fire: (callback: () => Promise<void>, options?: ConfirmOptions) => void;
}

interface ConfirmOptions {
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>({
        title: 'Confirm Action',
        message: 'Are you sure you want to proceed?',
        confirmText: 'Yes',
        cancelText: 'Cancel',
    });
    const [callback, setCallback] = useState<(() => Promise<void>) | null>(null);

    const fire = (cb: () => Promise<void>, opts?: ConfirmOptions) => {
        setCallback(() => cb);
        setOptions({
            title: opts?.title || 'Confirm Action',
            message: opts?.message || 'Are you sure you want to proceed?',
            confirmText: opts?.confirmText || 'Yes',
            cancelText: opts?.cancelText || 'Cancel',
        });
        setIsOpen(true);
    };

    const handleConfirm = async () => {
        if (callback) {
            setIsLoading(true);
            try {
                await callback();
            } catch (error) {
                console.error('Error during confirmation callback:', error);
            } finally {
                setIsLoading(false);
                setIsOpen(false);
                setCallback(null);
            }
        }
    };

    const handleCancel = () => {
        if (!isLoading) {
            setIsOpen(false);
            setCallback(null);
        }
    };

    return (
        <ConfirmContext.Provider value={{ fire }}>
            {children}
            <Dialog open={isOpen} onOpenChange={(open) => !isLoading && !open && handleCancel()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{options.title}</DialogTitle>
                        <DialogDescription>{options.message}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isLoading}
                        >
                            {options.cancelText}
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Processing...' : options.confirmText}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
}
