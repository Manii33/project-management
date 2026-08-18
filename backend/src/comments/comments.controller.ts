import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { UserRole } from '../users/user.entity';

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('issues/:issueId/comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Add comment (project members only)' })
  create(
    @Param('issueId', ParseUUIDPipe) issueId: string,
    @Body() dto: CreateCommentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.commentsService.create(issueId, dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all comments for an issue' })
  findAll(
    @Param('issueId', ParseUUIDPipe) issueId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.commentsService.findAll(issueId, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update own comment (admin can moderate)' })
  update(
    @Param('issueId', ParseUUIDPipe) issueId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.commentsService.update(id, dto, req.user.id, req.user.role === UserRole.ADMIN);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete own comment (admin can moderate)' })
  remove(
    @Param('issueId', ParseUUIDPipe) issueId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.commentsService.remove(id, req.user.id, req.user.role === UserRole.ADMIN);
  }
}