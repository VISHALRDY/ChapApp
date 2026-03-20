using ChapApp.Backend.Data;
using ChapApp.Backend.Helpers;
using ChapApp.Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace ChapApp.Backend.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly ApplicationDbContext _context;
    private readonly UserConnectionManager _connectionManager;

    public ChatHub(ApplicationDbContext context, UserConnectionManager connectionManager)
    {
        _context = context;
        _connectionManager = connectionManager;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!string.IsNullOrEmpty(userId))
        {
            _connectionManager.AddConnection(userId, Context.ConnectionId);
            await Clients.All.SendAsync("UserOnline", userId);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        _connectionManager.RemoveConnection(Context.ConnectionId);

        if (!string.IsNullOrEmpty(userId))
        {
            await Clients.All.SendAsync("UserOffline", userId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    // 🔥 UPDATED METHOD
    public async Task SendPrivateMessage(int receiverId, string message)
    {
        var senderIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(senderIdClaim))
            throw new HubException("Unauthorized user.");

        if (!int.TryParse(senderIdClaim, out int senderId))
            throw new HubException("Invalid sender ID.");

        if (string.IsNullOrWhiteSpace(message))
            throw new HubException("Message cannot be empty.");

        // Create message with status
        var newMessage = new Message
        {
            SenderId = senderId,
            ReceiverId = receiverId,
            Content = message,
            SentAt = DateTime.UtcNow,
            Status = "Sent"
        };

        _context.Messages.Add(newMessage);
        await _context.SaveChangesAsync();

        // Send to receiver
        await Clients.User(receiverId.ToString()).SendAsync(
            "ReceiveMessage",
            newMessage.Id,
            newMessage.SenderId,
            newMessage.ReceiverId,
            newMessage.Content,
            newMessage.SentAt,
            newMessage.Status
        );

        // Update status → Delivered
        newMessage.Status = "Delivered";
        await _context.SaveChangesAsync();

        // Notify sender (status update)
        await Clients.Caller.SendAsync(
            "MessageStatusUpdated",
            newMessage.Id,
            newMessage.Status
        );
    }

    // ✅ NEW FEATURE — Read Receipt
    public async Task MarkAsRead(int messageId)
    {
        var message = await _context.Messages.FindAsync(messageId);

        if (message == null)
            return;

        message.Status = "Read";
        await _context.SaveChangesAsync();

        // Notify sender that message is read
        await Clients.User(message.SenderId.ToString())
            .SendAsync("MessageRead", messageId);
    }

    // Typing indicator (your code — unchanged ✅)
    public async Task Typing(int receiverId)
    {
        var senderId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!string.IsNullOrEmpty(senderId))
        {
            await Clients.User(receiverId.ToString())
                .SendAsync("UserTyping", senderId);
        }
    }
}