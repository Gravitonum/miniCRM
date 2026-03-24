import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { clientsApi } from '../../api/clients';

interface DeleteClientDialogProps {
    isOpen: boolean;
    onClose: () => void;
    clientId: string;
    clientName: string;
    onSuccess: () => void;
}

/**
 * DeleteClientDialog — модальное окно подтверждения удаления клиента.
 * Отображает предупреждение о необратимости действия и вызывает API удаления.
 *
 * @example
 * <DeleteClientDialog
 *   isOpen={isDeleteDialogOpen}
 *   onClose={() => setIsDeleteDialogOpen(false)}
 *   clientId={client.id}
 *   clientName={client.name}
 *   onSuccess={() => refreshList()}
 * />
 */
export function DeleteClientDialog({
    isOpen,
    onClose,
    clientId,
    clientName,
    onSuccess,
}: DeleteClientDialogProps): ReactElement {
    const { t } = useTranslation();
    const [isDeleting, setIsDeleting] = useState(false);

    /**
     * Выполнить удаление через API.
     * @returns {Promise<void>}
     */
    const handleDelete = async (): Promise<void> => {
        setIsDeleting(true);
        try {
            await clientsApi.delete(clientId);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to delete client:', error);
            // В реальном приложении здесь можно показать toast-уведомление
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader className="space-y-3">
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="w-5 h-5" />
                        <DialogTitle className="text-xl font-bold">
                            {t('clients.deleteConfirm.title', 'Удаление клиента')}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-foreground/80 leading-relaxed">
                        {t('clients.deleteConfirm.description', { name: clientName })}
                    </DialogDescription>
                </DialogHeader>

                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3 my-2">
                    <Trash2 className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm font-semibold text-destructive leading-tight">
                        {t('clients.deleteConfirm.warning', 'Внимание: это действие удалит все данные о клиенте!')}
                    </p>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="w-full sm:w-auto hover:bg-muted"
                    >
                        {t('clients.deleteConfirm.cancel', 'Отмена')}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => void handleDelete()}
                        disabled={isDeleting}
                        className="w-full sm:w-auto font-bold shadow-lg shadow-destructive/20"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                {t('common.deleting', 'Удаление...')}
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4 mr-2" />
                                {t('clients.deleteConfirm.confirm', 'Удалить')}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
