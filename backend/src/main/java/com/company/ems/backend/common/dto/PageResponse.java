package com.company.ems.backend.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean first;
    private boolean last;
    private String displayInfo;
    public static <T> PageResponse<T> of(
            List<T> content,
            int page,
            int size,
            long totalElements,
            int totalPages,
            String entityName) {

        int from = totalElements == 0 ? 0 : page * size + 1;
        int to   = (int) Math.min((long)(page + 1) * size, totalElements);
        String info = String.format("Hiển thị %d-%d trên %d %s", from, to, totalElements, entityName);

        return PageResponse.<T>builder()
                .content(content)
                .page(page)
                .size(size)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .displayInfo(info)
                .build();
    }
}
