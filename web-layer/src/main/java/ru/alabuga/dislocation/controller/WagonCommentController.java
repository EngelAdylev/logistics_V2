package ru.alabuga.dislocation.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ru.alabuga.dislocation.dto.comment.AddWagonCommentRequest;
import ru.alabuga.dislocation.dto.comment.WagonCommentDto;
import ru.alabuga.dislocation.service.WagonCommentService;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@Tag(name = "wagon-comments")
@RestController
@RequestMapping("/wagons/{wagonId}/comments")
@RequiredArgsConstructor
public class WagonCommentController {

    private final WagonCommentService service;

    @Operation(summary = "История комментариев к вагону")
    @GetMapping
    public List<WagonCommentDto> list(@PathVariable UUID wagonId) {
        return service.getByWagon(wagonId);
    }

    @Operation(summary = "Добавить комментарий к вагону")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WagonCommentDto add(@PathVariable UUID wagonId,
                                @Valid @RequestBody AddWagonCommentRequest request,
                                Principal principal) {
        String author = principal != null ? principal.getName() : "system";
        return service.add(wagonId, author, request.getBody());
    }
}
