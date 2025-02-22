import { useState } from 'react';
import { toast } from 'react-toastify';
import { showNotification } from '../alerts';
import { deleteRequest, getRequest, postRequest, putRequest } from '../api';
import useUserAuthContext from './useUserAuthContext';
import { useQuery } from '@tanstack/react-query';
import { VOTE_TYPE } from '../../constants';
import { useParams } from 'react-router-dom';

const useSubmitVote = ({ blogId = '', commentId = '' }) => {
  const { sendNotification } = useUserAuthContext();
  const { blogID: blogIdFromParams } = useParams();

  const message = {
    [VOTE_TYPE.UP_VOTE]: 'upvote',
    [VOTE_TYPE.DOWN_VOTE]: 'downvote',
  };

  const { currentUser } = useUserAuthContext();
  const [voteId, setVoteId] = useState();
  const itemType = blogId ? 'Blog' : 'Comment';

  const [voteType, setVoteType] = useState('');

  const { data: existingVoteType, refetch } = useQuery({
    queryKey: ['Existing Vote Type', blogId ? blogId : commentId],
    queryFn: async () => {
      const endpoint = blogId
        ? `/vote/vote-type?blogId=${blogId}`
        : `/vote/vote-type?commentId=${commentId}`;

      const res = await getRequest({
        endpoint,
      });

      if (res.ok) {
        setVoteType(res.data.voteType);
        setVoteId(res.data.voteId);

        return '';
      }

      setVoteType('');

      return '';
    },
  });

  const submitVote =
    ({ authorId, voteType: newVoteType }) =>
    async () => {
      if (!currentUser) {
        showNotification({
          icon: 'error',
          title: 'Error!',
          message: `You must be logged in to vote the ${itemType}.`,
        });
        return;
      }

      if (!voteId && !voteType) {
        setVoteType(newVoteType);
        await postVote({ newVoteType, authorId });
        refetch();
        return;
      }

      if (voteId && voteType === newVoteType) {
        setVoteType('');
        await deleteVote(authorId);
        refetch();
        return;
      }

      if (voteId && voteType !== newVoteType) {
        setVoteType(newVoteType);
        await updateVote({ newVoteType, authorId });
        refetch();
        return;
      }
    };

  const postVote = async ({ newVoteType, authorId }) => {
    sendNotification({
      blogId: blogIdFromParams,
      userId: authorId,
      message: `${currentUser.firstName} has ${message[newVoteType]}d your ${itemType}`,
    });

    showNotification({
      icon: 'success',
      title: 'Success!!',
      message: `You ${message[newVoteType]} the ${itemType} !!!`,
    });

    await postRequest({
      endpoint: `/vote`,
      data: {
        commentId,
        blogId,
        voteType: newVoteType,
      },
    });
  };

  const deleteVote = async authorId => {
    sendNotification({
      blogId: blogIdFromParams,
      userId: authorId,
      message: `${currentUser.firstName} has deleted vote in a ${itemType}`,
    });

    showNotification({
      icon: 'success',
      title: 'Success!!',
      message: `You removed  the vote!!!`,
    });

    await deleteRequest({
      endpoint: `/vote/${voteId}`,
    });
  };

  const updateVote = async ({ newVoteType, authorId }) => {
    sendNotification({
      blogId: blogIdFromParams,
      userId: authorId,
      message: `${currentUser.firstName} has ${message[newVoteType]}d on your ${itemType}`,
    });

    showNotification({
      icon: 'success',
      title: 'Success!!',
      message: `You ${message[newVoteType]} the ${itemType} !!!`,
    });

    await putRequest({
      endpoint: `/vote/vote-type/update/${voteId}?voteType=${newVoteType}`,
    });
  };

  return { submitVote, voteType, setVoteType };
};

export default useSubmitVote;

