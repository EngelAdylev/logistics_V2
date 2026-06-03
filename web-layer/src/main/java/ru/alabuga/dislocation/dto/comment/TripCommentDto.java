package ru.alabuga.dislocation.dto.comment;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class TripCommentDto {
    private UUID id;
    private String author;
    private String body;
    private Instant createdAt;
}
