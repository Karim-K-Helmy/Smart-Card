import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { markAdminNotificationAsRead } from '../../services/api/admin';
import { deleteMessage, listMessages, replyToMessage, updateMessageStatus } from '../../services/api/messages';
import { extractApiError, formatDate } from '../../utils/api';

const BADGE_SYNC_EVENT = 'dashboard-badge-sync';

const initialReplyState = {
  open: false,
  saving: false,
  error: '',
  message: null,
  replyText: '',
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: '' });
  const [replyState, setReplyState] = useState(initialReplyState);
  const [confirmState, setConfirmState] = useState({ open: false, loading: false, messageId: '', title: '', description: '' });

  const load = async () => {
    try {
      const { data } = await listMessages();
      setMessages(data.data.data || []);
      setStatus({ loading: false, error: '' });
    } catch (error) {
      setStatus({ loading: false, error: extractApiError(error) });
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.allSettled([markAdminNotificationAsRead('messages'), load()]);
      window.dispatchEvent(new CustomEvent(BADGE_SYNC_EVENT, { detail: { area: 'admin', key: 'messages' } }));
    };

    init();
  }, []);

  const changeStatus = async (messageId, nextStatus) => {
    try {
      await updateMessageStatus(messageId, { status: nextStatus });
      await load();
    } catch (error) {
      setStatus({ loading: false, error: extractApiError(error) });
    }
  };

  const openReplyModal = (msg) => {
    setReplyState({
      open: true,
      saving: false,
      error: '',
      message: msg,
      replyText: `مرحبًا ${msg.name}،\n\nشكرًا على رسالتك.\n`,
    });
  };

  const closeReplyModal = () => setReplyState(initialReplyState);

  const submitReply = async (event) => {
    event.preventDefault();
    if (!replyState.message) return;

    setReplyState((prev) => ({ ...prev, saving: true, error: '' }));
    try {
      await replyToMessage(replyState.message._id, {
        replyText: replyState.replyText,
        subject: `رد بخصوص: ${replyState.message.subject}`,
      });
      await load();
      closeReplyModal();
    } catch (error) {
      setReplyState((prev) => ({ ...prev, saving: false, error: extractApiError(error) }));
    }
  };

  const askDelete = (msg) => {
    setConfirmState({
      open: true,
      loading: false,
      messageId: msg._id,
      title: 'حذف الرسالة نهائيًا',
      description: `سيتم حذف الرسالة بعنوان "${msg.subject}" نهائيًا من قاعدة البيانات.`,
    });
  };

  const confirmDelete = async () => {
    setConfirmState((prev) => ({ ...prev, loading: true }));
    try {
      await deleteMessage(confirmState.messageId);
      await load();
      setConfirmState({ open: false, loading: false, messageId: '', title: '', description: '' });
    } catch (error) {
      setStatus({ loading: false, error: extractApiError(error) });
      setConfirmState((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <>
      <div className="stack-lg">
        <PageHeader
          title="رسائل التواصل"
          text="يمكنك الرد على العميل مباشرة من داخل النظام أو حذف الرسائل نهائيًا من قاعدة البيانات."
        />
        {status.error ? <Card><p className="error-text">{status.error}</p></Card> : null}
        <div className="stack-md">
          {messages.map((msg) => (
            <Card
              key={msg._id}
              title={msg.subject}
              action={<Badge tone={msg.status === 'new' ? 'warning' : msg.status === 'archived' ? 'default' : 'info'}>{msg.status}</Badge>}
            >
              <p><strong>{msg.name}</strong> — {msg.email} — {msg.phone || '-'}</p>
              <p>{msg.message}</p>
              {msg.lastReplyText ? (
                <div className="notice-card notice-success">
                  <strong>آخر رد مرسل</strong>
                  <p>{msg.lastReplyText}</p>
                </div>
              ) : null}
              <div className="row-actions">
                <Button onClick={() => openReplyModal(msg)}>رد مباشر</Button>
                <Button variant="ghost" onClick={() => changeStatus(msg._id, msg.status === 'archived' ? 'read' : 'archived')}>
                  {msg.status === 'archived' ? 'تحديد كمقروء' : 'أرشفة'}
                </Button>
                {msg.status === 'new' ? <Button variant="secondary" onClick={() => changeStatus(msg._id, 'read')}>تعليم كمقروء</Button> : null}
                <Button variant="danger" onClick={() => askDelete(msg)}>حذف نهائي</Button>
              </div>
              <small>{formatDate(msg.createdAt)}</small>
            </Card>
          ))}
        </div>
      </div>

      <Modal
        open={replyState.open}
        onClose={closeReplyModal}
        size="lg"
        title={`الرد على ${replyState.message?.name || ''}`}
        description={replyState.message?.email || ''}
        footer={(
          <>
            <Button variant="ghost" onClick={closeReplyModal}>إلغاء</Button>
            <Button onClick={submitReply} disabled={replyState.saving}>{replyState.saving ? 'جارٍ الإرسال...' : 'إرسال الرد'}</Button>
          </>
        )}
      >
        <form className="stack-md" onSubmit={submitReply}>
          <label>
            <span>نص الرد</span>
            <textarea rows="10" value={replyState.replyText} onChange={(e) => setReplyState((prev) => ({ ...prev, replyText: e.target.value }))} />
          </label>
          {replyState.error ? <p className="error-text">{replyState.error}</p> : null}
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmState.open}
        onClose={() => setConfirmState({ open: false, loading: false, messageId: '', title: '', description: '' })}
        onConfirm={confirmDelete}
        title={confirmState.title}
        description={confirmState.description}
        loading={confirmState.loading}
        confirmText="حذف الرسالة"
      />
    </>
  );
}
