using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Rooms;
using EnglishCenter.Api.Security;
using EnglishCenter.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = PolicyNames.ManageRooms)]
public class RoomsController : ControllerBase
{
    private readonly IRoomService _roomService;

    public RoomsController(IRoomService roomService)
    {
        _roomService = roomService;
    }

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] RoomQuery query, CancellationToken cancellationToken)
    {
        var result = await _roomService.GetListAsync(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<RoomListItemResponse>>.Ok(result, "Rooms retrieved successfully."));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _roomService.GetDetailAsync(id, cancellationToken);
        return Ok(ApiResponse<RoomDetailResponse>.Ok(result, "Room retrieved successfully."));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRoomRequest request, CancellationToken cancellationToken)
    {
        var result = await _roomService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            ApiResponse<RoomDetailResponse>.Ok(result, "Room created successfully."));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateRoomRequest request, CancellationToken cancellationToken)
    {
        var result = await _roomService.UpdateAsync(id, request, cancellationToken);
        return Ok(ApiResponse<RoomDetailResponse>.Ok(result, "Room updated successfully."));
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateRoomStatusRequest request, CancellationToken cancellationToken)
    {
        var result = await _roomService.UpdateStatusAsync(id, request, cancellationToken);
        return Ok(ApiResponse<RoomDetailResponse>.Ok(result, "Room status updated successfully."));
    }
}
