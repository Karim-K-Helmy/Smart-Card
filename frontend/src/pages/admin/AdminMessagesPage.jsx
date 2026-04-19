import { useEffect, useMemo, useState } from 'react';
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

const statusToneMap = {
  new: 'warning',
  read: 'info',
  archived: 'default',
  replied: 'success',
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

  const messageStats = useMemo(() => ({
    total: messages.length,
    fresh: messages.filter((msg) => msg.status === 'new').length,
    archived: messages.filter((msg) => msg.status === 'archived').length,
    replied: messages.filter((msg) => msg.lastReplyText).length,
  }), [messages]);

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
      replyText: `مرحبًا ${msg.name}،

شكرًا على رسالتك.
`,
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
      <div className="stack-lg admin-messages-page">
        <PageHeader
          title="رسائل التواصل"
          text="واجهة رسائل احترافية مع بطاقات أنيقة، مؤشرات سريعة، وأزرار تنفيذ عصرية لرفع كفاءة فريق الإدارة."
          actions={<Button variant="secondary" onClick={load}>تحديث الرسائل</Button>}
        />

        <div className="admin-message-stats-grid">
          <Card className="message-stat-card"><strong>{messageStats.total}</strong><span>إجمالي الرسائل</span></Card>
          <Card className="message-stat-card"><strong>{messageStats.fresh}</strong><span>رسائل جديدة</span></Card>
          <Card className="message-stat-card"><strong>{messageStats.replied}</strong><span>تم الرد عليها</span></Card>
          <Card className="message-stat-card"><strong>{messageStats.archived}</strong><span>المؤرشفة</span></Card>
        </div>

        {status.error ? <Card><p className="error-text">{status.error}</p></Card> : null}

        <div className="admin-message-list">
          {messages.map((msg) => (
            <Card key={msg._id} className="admin-message-card">
              <div className="admin-message-card-head">
                <div className="admin-message-subject-wrap">
                  <div className="admin-message-icon"><i className="fa-solid fa-envelope-open-text"></i></div>
                  <div>
                    <h3>{msg.subject}</h3>
                    <p>{formatDate(msg.createdAt)}</p>
                  </div>
                </div>
                <Badge tone={statusToneMap[msg.status] || 'default'}>{msg.status}</Badge>
              </div>

              <div className="admin-message-contact-grid">
                <div><span>المرسل</span><strong>{msg.name}</strong></div>
                <div><span>البريد الإلكتروني</span><strong>{msg.email}</strong></div>
                <div><span>الهاتف</span><strong>{msg.phone || '-'}</strong></div>
              </div>

              <div className="admin-message-body-panel">
                <span>نص الرسالة</span>
                <p>{msg.message}</p>
              </div>

              {msg.lastReplyText ? (
                <div className="admin-message-reply-preview">
                  <div className="reply-preview-head">
                    <i className="fa-solid fa-paper-plane"></i>
                    <strong>آخر رد مرسل</strong>
                  </div>
                  <p>{msg.lastReplyText}</p>
                </div>
              ) : null}

              <div className="admin-message-actions">
                <Button className="message-action-btn" onClick={() => openReplyModal(msg)}>
                  <i className="fa-solid fa-reply"></i>
                  رد مباشر
                </Button>
                <Button
                  variant="ghost"
                  className="message-action-btn"
                  onClick={() => changeStatus(msg._id, msg.status === 'archived' ? 'read' : 'archived')}
                >
                  <i className={`fa-solid ${msg.status === 'archived' ? 'fa-eye' : 'fa-box-archive'}`}></i>
                  {msg.status === 'archived' ? 'تحديد كمقروء' : 'أرشفة'}
                </Button>
                {msg.status === 'new' ? (
                  <Button variant="secondary" className="message-action-btn" onClick={() => changeStatus(msg._id, 'read')}>
                    <i className="fa-solid fa-check-double"></i>
                    تعليم كمقروء
                  </Button>
                ) : null}
                <Button variant="danger" className="message-action-btn" onClick={() => askDelete(msg)}>
                  <i className="fa-solid fa-trash-can"></i>
                  حذف نهائي
                </Button>
              </div>
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
