using System.Collections.Concurrent;

namespace ChapApp.Backend.Helpers;

public class UserConnectionManager
{
    private readonly ConcurrentDictionary<string, string> _connections = new();

    public void AddConnection(string userId, string connectionId)
    {
        _connections[userId] = connectionId;
    }

    public void RemoveConnection(string connectionId)
    {
        var user = _connections.FirstOrDefault(x => x.Value == connectionId);

        if (!string.IsNullOrEmpty(user.Key))
        {
            _connections.TryRemove(user.Key, out _);
        }
    }

    public List<string> GetOnlineUsers()
    {
        return _connections.Keys.ToList();
    }

    public string? GetConnectionId(string userId)
    {
        return _connections.GetValueOrDefault(userId);
    }
}