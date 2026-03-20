using ChapApp.Backend.Data;
using ChapApp.Backend.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChapApp.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly UserConnectionManager _connectionManager;
    private readonly ApplicationDbContext _context;

    public UsersController(UserConnectionManager connectionManager, ApplicationDbContext context)
    {
        _connectionManager = connectionManager;
        _context = context;
    }

    [HttpGet("online")]
    public IActionResult GetOnlineUsers()
    {
        return Ok(_connectionManager.GetOnlineUsers());
    }

    [HttpGet]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _context.Users
            .Select(u => new { u.Id, u.Name, u.Email })
            .ToListAsync();

        return Ok(users);
    }
}