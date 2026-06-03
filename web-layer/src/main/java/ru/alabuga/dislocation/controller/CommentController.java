package ru.alabuga.dislocation.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ru.alabuga.dislocation.dto.comment.AddCommentRequest;
import ru.alabuga.dislocation.dto.comment.TripCommentDto;
import ru.alabuga.dislocation.service.CommentService;

import java.util.List;
import java.util.UUID;

@Tag(name = "comments")
@RestController
@RequestMapping("/trips/{tripId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @Operation(summary = "Комментарии к рейсу")
    @GetMapping
    public List<TripCommentDto> list(@PathVariable UUID tripId) {
        return commentService.getByTrip(tripId);
    }

    @Operation(summary = "Добавить комментарий")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TripCommentDto add(@PathVariable UUID tripId,
                               @Valid @RequestBody AddCommentRequest request) {
        return commentService.add(tripId, request);
    }
}
